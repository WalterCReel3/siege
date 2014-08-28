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

#include "Adafruit_NeoPixel.h"

Adafruit_NeoPixel * strips[4];
byte strip_pins[4] = {4, 5, 6, 7};
byte strip_leds[4] = {60, 60, 60, 60};

static char cmd[16];
static byte cmd_idx = 0;

void setup() {
  Serial.begin(115200);
  memset(cmd, 0, sizeof(cmd));

  for (int i = 0; i < sizeof(strips); i++) {
    strips[i] = new Adafruit_NeoPixel(strip_leds[i], strip_pins[i], NEO_GRB + NEO_KHZ800);
    strips[i]->begin();
    strips[i]->show();
  }
  
  for (int i = 0; i < sizeof(strips); i++) {
    for (int p = 0; p < strip_leds[i]; p++) {
      strips[i]->setPixelColor(p, 255, 255, 0);
    }
    strips[i]->show();
  }
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

void exec_cmd() {
  if (strncmp(cmd, "set", sizeof(3)) == 0) {
    // TODO
  } else {
    Serial.print("unknown command: ");
    Serial.println(cmd);
  }  
}
