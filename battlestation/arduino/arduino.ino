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
    strips[i] = &Adafruit_NeoPixel(strip_leds[i], strip_pins[i], NEO_GRB + NEO_KHZ800);
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
    Serial.print("\n> ");
  }
}

static const char cmd_teams[] = "teams";
static const char cmd_team[] = "team t rrr ggg bbb";
static const char cmd_strip[] = "strip s t 11 t 22 t 33";
static const char cmd_help[] = "help";

void exec_cmd() {
  if (strncmp(cmd, "teams", 5) == 0) {
    exec_teams();
  } else if (strncmp(cmd, "team", 4) == 0) {
    exec_team();
  } else if (strncmp(cmd, "strip", 5) == 0) {
    exec_strip();
  } else if (strncmp(cmd, "help", 4) == 0) {
    Serial.println(cmd_teams);
    Serial.println(cmd_team);
    Serial.println(cmd_help);
    return;
  } else {
    Serial.print("unknown command: ");
    Serial.println(cmd);
    return;
  }  
  Serial.println("ok");
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

void exec_teams(){
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

void exec_team() {
  if (strlen(cmd) < strlen(cmd_team)) {
    usage(cmd_team);
    return;
  }
  int t = read_int(&cmd[5], 1);
  if (t > 2) {
    Serial.println("Invalid team number");
    return;
  }
  int r = read_int(&cmd[7], 3);
  int g = read_int(&cmd[11], 3);
  int b = read_int(&cmd[15], 3);
  team_colors[t] = Adafruit_NeoPixel::Color(r, g, b);
}

void exec_strip() {
  if (strlen(cmd) < strlen(cmd_strip)) {
    usage(cmd_strip);
    return;
  }
  int strip = read_int(&cmd[6], 1);
  if (strip > 3) {
    Serial.println("Invalid strip number");
    return;
  }

  byte led = 0;  

  // Read the three "t 11" parts
  for (byte i = 8; i < 19; i += 5) {
    int team = read_int(&cmd[i], 1);
    if (team > 3) {
      Serial.println("Invalid team number");
      return;
    }
    int team_leds = read_int(&cmd[i + 2], 2);
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
