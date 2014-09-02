/*
  This file is part of the Siege Battlestation Indicator.

  Siege Battlestation Indicator is free software: you can 
  redistribute it and/or modify it under the terms of the GNU 
  Lesser General Public License as published by the Free Software 
  Foundation, either version 3 of the License, or (at your option) 
  any later version.

  Siege Battlestation Indicator is distributed in the hope that it 
  will be useful, but WITHOUT ANY WARRANTY; without even the implied 
  warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
  See the GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public
  License along with Siege.  If not, see
  <http://www.gnu.org/licenses/>.
*/

#include <stdlib.h>

#include "Adafruit_NeoPixel.h"

#define SCORE_STRIPS 4
#define SCORE_STRIP_LEDS 60

static Adafruit_NeoPixel * score_strips[SCORE_STRIPS];
static byte score_pins[] = {4, 5, 6, 8};

#define TEAMS 3
static uint32_t team_colors[TEAMS];

void setup() {
  Serial.begin(115200);

  team_colors[0] = Adafruit_NeoPixel::Color(255, 0, 0);
  team_colors[1] = Adafruit_NeoPixel::Color(0, 255, 0);
  team_colors[2] = Adafruit_NeoPixel::Color(0, 0, 255);
  
  for (byte i = 0; i < SCORE_STRIPS; i++) {
    score_strips[i] = new Adafruit_NeoPixel(SCORE_STRIP_LEDS, score_pins[i], NEO_GRB + NEO_KHZ800);    
    score_strips[i]->begin();
    for (byte l = 0; l < SCORE_STRIP_LEDS; l++) {
      score_strips[i]->setBrightness(255);
      score_strips[i]->setPixelColor(l, 0, 0, 0);
    }
    score_strips[i]->show();
  }
  flash(*score_strips[0], Adafruit_NeoPixel::Color(0, 0, 0), 10, 20);
}

void loop() {
  read_and_exec_cmd();
}

void read_and_exec_cmd() {
  static char cmd[20];
  static byte cmd_idx = 0;

  while (Serial.available()) {
    char c = Serial.read();
    boolean clear = false;

    if (c != '\n' && cmd_idx < sizeof(cmd)) {
      cmd[cmd_idx++] = c;
      continue;
    }

    if (c == '\n') {
      cmd[cmd_idx] = 0;
      exec_cmd();
    } else {
      Serial.println  ("command too long");
    }
    
    // Done executing or buffer is full before newline
    memset(cmd, 0, sizeof(cmd));
    cmd_idx = 0;
    Serial.print("> ");
  }
}

void exec_cmd(const char * cmd) {
  boolean ok = false;
  char * tok = NULL;
  const char * cmd_name = strtok_r(cmd, " ", &tok);
  if (strcmp(cmd_name, "s") == 0) {
    ok = exec_score(tok);
  } else if (strcmp(cmd_name, "f") == 0) {
    ok = exec_flash(tok);
  } else if (strcmp(cmd_name, "p") == 0) {
    // the "ok" is the result
    ok = true;
  } else if (strcmp(cmd_name, "h") == 0) {
    Serial.println("f(lash) s");
    Serial.println("h(elp)");
    Serial.println("s(core) s t # t # t #");
    Serial.println("p(ing)");   
    ok = true;
  }

  if (ok) {
    Serial.println("ok");
  } else {
    Serial.println("err");
  }
}

boolean exec_flash(char * tok) {
  // Read strip number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.println("strip required");
    return false;
  }
  int strip = atoi(arg);
  if (strip > 3) {
    Serial.println("strip is 0,1,2,3");
    return false;
  }
  flash(*score_strips[strip], Adafruit_NeoPixel::Color(255, 255, 0), 5, 80);
  return true;
}

boolean exec_score(char * tok) {
  // Read strip number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.println("strip required");
    return false;
  }
  int strip = atoi(arg);
  if (strip > 3) {
    Serial.println("strip is 0,1,2,3");
    return false;
  }

  byte led = 0;
  // Read the three groups of "teamNumber ledCount"
  for (byte i = 0; i < 3; i++) {
    // Read the team
    arg = strtok_r(NULL, " ", &tok);
    if (arg == NULL) {  
      Serial.println("team required");
      return false;
    }
    int team = atoi(arg);
    if (team > 2) {
      Serial.println("team is 0,1,2");
      return false;
    }

    // Read the LED count
    arg = strtok_r(NULL, " ", &tok);
    if (arg == NULL) {  
      Serial.println("led # required");
      return false;
    }
    int team_leds = atoi(arg);

    // Enable the LEDs
    for (byte l = 0; l < team_leds; l++) {
      score_strips[strip]->setPixelColor(led + l, team_colors[team]);
    }
    led += team_leds;
  }
  
  // Black out remaining leds
  for (byte l = led; l < 60; l++) {
    score_strips[strip]->setPixelColor(l, 0, 0, 0);
  }
  score_strips[strip]->show();
  return true;
}

void flash(Adafruit_NeoPixel & strip, uint32_t color, byte times, unsigned long delay_ms) {
  uint32_t old_colors[SCORE_STRIP_LEDS];
  for (byte i = 0; i < SCORE_STRIP_LEDS; i++) {
    old_colors[i] = strip.getPixelColor(i);
  }
  
  // Flash
  for (int j = 0; j < times; j++) {
    for (byte i = 0; i < SCORE_STRIP_LEDS; i++) {
      strip.setPixelColor(i, color);
    }
    strip.show();
    
    delay(delay_ms);
    
    for (byte i = 0; i < SCORE_STRIP_LEDS; i++) {
      strip.setPixelColor(i, old_colors[i]);
    }
    strip.show();
    
    // Skip this delay the last time
    if (j < times - 1) {
      delay(delay_ms / 2);
    }
  }
}

