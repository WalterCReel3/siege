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

static Adafruit_NeoPixel * strips[4];
static byte strip_pins[4] = {4, 5, 6, 7};
static byte strip_leds[4] = {60, 60, 60, 60};

static uint32_t team_colors[3];

static char cmd[32];
static byte cmd_idx = 0;

void setup() {
  Serial.begin(115200);
  
  for (byte i = 0; i < 4; i++) {
    strips[i] = new Adafruit_NeoPixel(strip_leds[i], strip_pins[i], NEO_GRB + NEO_KHZ800);
    strips[i]->begin();
    strips[i]->show();
  }

  for (byte i = 0; i < sizeof(strips); i++) {
    for (byte p = 0; p < strip_leds[i]; p++) {
      strips[i]->setPixelColor(p, 0, 0, 0);
    }
    strips[i]->show();
  }
  
  team_colors[0] = Adafruit_NeoPixel::Color(255, 0, 0);
  team_colors[1] = Adafruit_NeoPixel::Color(0, 255, 0);
  team_colors[2] = Adafruit_NeoPixel::Color(0, 0, 255);
}

void loop() {
  read_and_exec_cmd();
}

void read_and_exec_cmd() {
  while (Serial.available()) {
    char c = Serial.read();
    boolean clear = false;

    if (c != '\n' && cmd_idx < sizeof(cmd)) {
      cmd[cmd_idx++] = c;
      continue;
    }

    if (c == '\n') {
      exec_cmd();
    } else {
      Serial.println("command too long");
    }
    
    // Done executing or buffer is full before newline
    memset(cmd, 0, sizeof(cmd));
    cmd_idx = 0;
    Serial.print("> ");
  }
}

void exec_cmd() {
  char * tok = NULL;
  const char * cmd_name = strtok_r(cmd, " ", &tok);
  if (strcmp(cmd_name, "teams") == 0) {
    exec_teams(tok);
  } else if (strcmp(cmd, "team") == 0) {
    exec_team(tok);
  } else if (strcmp(cmd, "strip") == 0) {
    exec_strip(tok);
  } else if (strcmp(cmd, "help") == 0) {
    Serial.println("teams");
    Serial.println("team <team_num> <r> <g> <b>");
    Serial.println("strip <strip_num> <team_num> <leds> <team_num> <leds> <team_num> <leds>");
    Serial.println("help");
  } else {
    Serial.print("unknown command: ");
    Serial.println(cmd);
  }  
}

void usage(const char * usage) {
  Serial.print("usage: ");
  Serial.println(usage);
}

int read_int(char * text, byte digits) {
  char s[digits + 1];
  byte i;
  for (i = 0; i < digits; i++) {
   s[i] = text[i];
  }
  s[i] = 0;
  return atoi(s);
}

void exec_teams(char * tok){
  for (byte i = 0; i < 3; i++) {
    Serial.print(i);
    Serial.print(": ");
    Serial.print((team_colors[i] >> 16) & 0xff, DEC);
    Serial.print(" ");
    Serial.print((team_colors[i] >> 8) & 0xff, DEC);
    Serial.print(" ");
    Serial.print((team_colors[i]) & 0xff, DEC);
    Serial.println();
  }
}

void exec_team(char * tok) {
  // Read team number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.println("team number is required");
    return;
  }
  int team = atoi(arg);
  if (team > 2) {
    Serial.println("team number is one of 0,1,2");
    return;
  }
  // Read colors
  arg = strtok_r(NULL, " ", &tok);
  int r = atoi(arg);
  arg = strtok_r(NULL, " ", &tok);
  int g = atoi(arg);
  arg = strtok_r(NULL, " ", &tok);
  int b = atoi(arg);
  team_colors[team] = Adafruit_NeoPixel::Color(r, g, b);
}

void exec_strip(char * tok) {
  // Read strip number
  char * arg = strtok_r(NULL, " ", &tok);
  if (arg == NULL) {  
    Serial.println("strip number is required");
    return;
  }
  int strip = atoi(arg);
  if (strip > 2) {
    Serial.println("strip number is one of 0,1,2");
    return;
  }

  byte led = 0;
  // Read the three groups of "teamNumber ledCount"
  for (byte i = 0; i < 3; i++) {
    // Read the team
    arg = strtok_r(NULL, " ", &tok);
    if (arg == NULL) {  
      Serial.println("team number is required");
      return;
    }
    int team = atoi(arg);
    if (team > 2) {
      Serial.println("team number is one of 0,1,2");
      return;
    }

    // Read the LED count
    arg = strtok_r(NULL, " ", &tok);
    if (arg == NULL) {  
      Serial.println("led count is required");
      return;
    }
    int team_leds = atoi(arg);

    // Enable the LEDs
    for (byte l = 0; l < team_leds; l++) {
      strips[strip]->setPixelColor(led + l, team_colors[team]);
    }
    led += team_leds;
  }
  
  // Black out remaining leds
  for (byte l = led; l < 60; l++) {
    strips[strip]->setPixelColor(l, 0, 0, 0);
  }
  strips[strip]->show();
}


