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
static byte score_pins[] = {9, 10, 11, 12};
static Adafruit_NeoPixel * score_strips[SCORE_STRIPS];

#define TARGET_STRIP_LEDS 45
#define TARGET_DIGIT_LEDS 15
static byte target_pin = 3;
static Adafruit_NeoPixel target_strip(TARGET_STRIP_LEDS, target_pin, NEO_GRB + NEO_KHZ800);

static boolean digit_1[TARGET_DIGIT_LEDS] = {1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0};
static boolean digit_2[TARGET_DIGIT_LEDS] = {1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1};
static boolean digit_3[TARGET_DIGIT_LEDS] = {1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1};
static boolean digit_4[TARGET_DIGIT_LEDS] = {1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1};

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
  }
  
  target_strip.begin();
  
  //flash(*score_strips[0], Adafruit_NeoPixel::Color(0, 0, 0), 10, 20);
  //flash(target_strip, Adafruit_NeoPixel::Color(255, 0, 0), 10, 20);
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
      exec_cmd(cmd);
    } else {
      Serial.print("command too long\n");
    }
    
    // Done executing or buffer is full before newline
    memset(cmd, 0, sizeof(cmd));
    cmd_idx = 0;
  }
}

void exec_cmd(char * cmd) {
  boolean ok = false;
  char * tok = NULL;
  const char * cmd_name = strtok_r(cmd, " ", &tok);
  if (strcmp(cmd_name, "s") == 0) {
    ok = exec_score(tok);
  } else if (strcmp(cmd_name, "f") == 0) {
    ok = exec_flash(tok);
  } else if (strcmp(cmd_name, "t") == 0) {
    ok = exec_target(tok);
  } else if (strcmp(cmd_name, "p") == 0) {
    // the "ok" is the result
    ok = true;
  } else if (strcmp(cmd_name, "h") == 0) {
    Serial.print("f(lash) strip count ms\n");
    Serial.print("h(elp)\n");
    Serial.print("s(core) strip team # team # team #\n");
    Serial.print("t(arget) team terr\n");
    Serial.print("p(ing)\n");
    ok = true;
  }

  if (ok) {
    Serial.print("ok\n");
  } else {
    Serial.print("err\n");
  }
}

static const char * e_strip_required = "strip required\n";
static const char * e_strip_nums = "strip is 0,1,2,3\n";
static const char * e_team_required = "team required\n";
static const char * e_team_nums = "team is 0,1,2\n";
static const char * e_led_required = "led # required\n";
static const char * e_count_required = "count required\n";
static const char * e_ms_required = "ms required\n";
static const char * e_territory_required = "territory required\n";
static const char * e_territory_nums = "territory is 0,1,2,3\n";

boolean exec_flash(char * tok) {
  // Read strip number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.print(e_strip_required);
    return false;
  }
  int strip = atoi(arg);
  if (strip > 3) {
    Serial.print(e_strip_nums);
    return false;
  }
  // Read count
  arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.print(e_count_required);
    return false;
  }
  int count = atoi(arg);
  // Read milliseconds
  arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.print(e_ms_required);
    return false;
  }
  int ms = atoi(arg);
  flash(*score_strips[strip], Adafruit_NeoPixel::Color(255, 255, 0), count, ms);
  return true;
}

boolean exec_score(char * tok) {
  // Read strip number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.print(e_strip_required);
    return false;
  }
  int strip = atoi(arg);
  if (strip > 3) {
    Serial.print(e_strip_nums);
    return false;
  }

  byte led = 0;
  // Read the three groups of "teamNumber ledCount"
  for (byte i = 0; i < 3; i++) {
    // Read the team
    arg = strtok_r(NULL, " ", &tok);
    if (arg == NULL) {  
      Serial.print(e_team_required);
      return false;
    }
    int team = atoi(arg);
    if (team > 2) {
      Serial.print(e_team_nums);
      return false;
    }

    // Read the LED count
    arg = strtok_r(NULL, " ", &tok);
    if (arg == NULL) {  
      Serial.print(e_led_required);
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

boolean exec_target(char * tok) {
  // Read team number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.print(e_team_required);
    return false;
  }
  int team = atoi(arg);
  if (team > 2) {
    Serial.print(e_team_nums);
    return false;
  }

  // Read territory number
  arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.print(e_territory_required);
    return false;
  }
  int territory = atoi(arg);
  if (territory > 3) {
    Serial.print(e_territory_nums);
    return false;
  }
  
  // Find the offset for the team's LED matrix
  byte start_led = team * TARGET_DIGIT_LEDS;
  for (int i = 0; i < TARGET_DIGIT_LEDS; i++) {
    byte * digit;
    switch (territory) {
      case 0:
        digit = digit_1;
        break;
      case 1:
        digit = digit_2;
        break;
      case 2:
        digit = digit_3;
        break;
      case 3:
        digit = digit_4;
        break;
      default:
        return false;
    }
    target_strip.setPixelColor(start_led + i, digit[i] ? team_colors[team] : 0);
  }
  target_strip.show();
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

