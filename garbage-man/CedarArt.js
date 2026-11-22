import React from 'react';
import Svg, {Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText} from 'react-native-svg';

// Scene art is drawn in a fixed 400 x 260 coordinate space. The container keeps
// that aspect ratio, so hotspots can be placed in the same units.
export const SCENE_WIDTH = 400;
export const SCENE_HEIGHT = 260;

function StreetArt() {
  const windows = [[14, 56], [58, 56], [102, 56], [14, 104], [58, 104], [102, 104]];
  return (
    <>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#b5c2aa" />
          <Stop offset="0.65" stopColor="#8e9b84" />
          <Stop offset="1" stopColor="#7a8672" />
        </LinearGradient>
        <LinearGradient id="bldgL" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6c6a58" />
          <Stop offset="1" stopColor="#55544a" />
        </LinearGradient>
        <LinearGradient id="bldgR" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#66735f" />
          <Stop offset="1" stopColor="#4f5d4d" />
        </LinearGradient>
        <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3b5a50" />
          <Stop offset="0.5" stopColor="#1f342e" />
          <Stop offset="1" stopColor="#2c4840" />
        </LinearGradient>
        <LinearGradient id="lit" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f0df9e" />
          <Stop offset="1" stopColor="#b9a866" />
        </LinearGradient>
        <LinearGradient id="truck" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5a8f92" />
          <Stop offset="1" stopColor="#376164" />
        </LinearGradient>
        <LinearGradient id="cab" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6aa09c" />
          <Stop offset="1" stopColor="#3f6a68" />
        </LinearGradient>
        <LinearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3b443e" />
          <Stop offset="1" stopColor="#222925" />
        </LinearGradient>
        <LinearGradient id="walk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8a9184" />
          <Stop offset="1" stopColor="#6c7267" />
        </LinearGradient>
        <LinearGradient id="foliage" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#607a54" />
          <Stop offset="1" stopColor="#3d5238" />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#ffe9a6" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#ffe9a6" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
          <Stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </RadialGradient>
      </Defs>

      {/* sky and distant skyline */}
      <Rect x="0" y="0" width="400" height="200" fill="url(#sky)" />
      <Rect x="150" y="96" width="30" height="80" fill="#7a8772" />
      <Rect x="184" y="112" width="22" height="64" fill="#77836d" />
      <Rect x="260" y="104" width="34" height="72" fill="#7b8871" />
      <Rect x="296" y="120" width="26" height="56" fill="#788570" />

      {/* left building */}
      <Rect x="0" y="34" width="150" height="140" fill="url(#bldgL)" />
      <Rect x="-2" y="28" width="154" height="10" fill="#474c42" />
      {windows.map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width="28" height="34" rx="2" fill={i === 4 ? 'url(#lit)' : '#25362f'} stroke="#8f8c74" strokeWidth="2" opacity={i === 4 ? 0.9 : 1} />
      ))}
      <Rect x="14" y="132" width="26" height="42" rx="2" fill="#3e4a3d" />
      <Rect x="18" y="138" width="18" height="36" fill="#2e382f" />

      {/* tree behind the lamp */}
      <Rect x="158" y="120" width="8" height="78" fill="#3a3f2e" />
      <Ellipse cx="162" cy="98" rx="46" ry="38" fill="url(#foliage)" />
      <Ellipse cx="140" cy="112" rx="22" ry="16" fill="#4f6a46" opacity="0.8" />

      {/* right building */}
      <Rect x="330" y="58" width="70" height="116" fill="url(#bldgR)" />
      <Rect x="328" y="52" width="74" height="8" fill="#3f4d3e" />
      <Rect x="345" y="84" width="34" height="38" rx="2" fill="url(#glass)" stroke="#aab2a0" strokeWidth="2" />
      <Path d="M349 88 L362 118 L372 118 L357 88 Z" fill="#dfe8d7" opacity="0.14" />
      <Rect x="345" y="134" width="34" height="30" rx="2" fill="#2a3a33" stroke="#7f8a78" strokeWidth="2" />

      {/* lamp post and glow */}
      <Rect x="203" y="54" width="4" height="146" fill="#2f352e" />
      <Path d="M205 56 Q 194 52 188 62" stroke="#2f352e" strokeWidth="3" fill="none" />
      <Circle cx="188" cy="66" r="34" fill="url(#glow)" />
      <Rect x="183" y="63" width="10" height="5" rx="2" fill="#fff1bf" />

      {/* sidewalk and road */}
      <Rect x="0" y="172" width="400" height="26" fill="url(#walk)" />
      <Rect x="0" y="197" width="400" height="3" fill="#b5b8a8" />
      <Rect x="0" y="200" width="400" height="60" fill="url(#road)" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
        <Rect key={i} x={i * 42 + 6} y="228" width="22" height="4" fill="#c9bb7e" opacity="0.55" />
      ))}

      {/* county truck */}
      <Ellipse cx="200" cy="200" rx="160" ry="5" fill="#000" opacity="0.25" />
      <Rect x="95" y="118" width="170" height="70" rx="6" fill="url(#truck)" />
      <Rect x="95" y="118" width="170" height="4" rx="2" fill="#86b1b2" opacity="0.7" />
      <Rect x="95" y="180" width="170" height="8" fill="#2c4d4f" />
      <Circle cx="246" cy="150" r="10" fill="none" stroke="#c8ddd2" strokeWidth="1.5" />
      <Path d="M240 150 L246 144 L252 150 L246 156 Z" fill="#c8ddd2" opacity="0.8" />
      <SvgText x="110" y="145" fill="#d3e5da" fontSize="8" fontWeight="700" letterSpacing="1.2">COUNTY</SvgText>
      <SvgText x="110" y="158" fill="#d3e5da" fontSize="8" fontWeight="700" letterSpacing="1.2">SANITATION</SvgText>
      <Path d="M265 132 L308 132 Q 330 134 336 160 L 336 188 L 265 188 Z" fill="url(#cab)" />
      <Path d="M272 140 L304 140 L320 160 L272 160 Z" fill="#1d3834" />
      <Path d="M276 143 L292 143 L300 152" stroke="#8fb7b0" strokeWidth="1.5" fill="none" opacity="0.5" />
      <Rect x="283" y="160" width="2" height="26" fill="#2c4a46" />
      <Rect x="333" y="170" width="6" height="7" fill="#f4dd96" />
      <Rect x="260" y="186" width="82" height="9" rx="2" fill="#242a27" />
      <Circle cx="128" cy="192" r="17" fill="#161c19" />
      <Circle cx="128" cy="192" r="8" fill="#5a6459" />
      <Circle cx="128" cy="192" r="3" fill="#9aa595" />
      <Circle cx="300" cy="192" r="17" fill="#161c19" />
      <Circle cx="300" cy="192" r="8" fill="#5a6459" />
      <Circle cx="300" cy="192" r="3" fill="#9aa595" />

      {/* wheelie bin */}
      <Rect x="350" y="158" width="28" height="36" rx="3" fill="#3c5a45" />
      <Rect x="348" y="154" width="32" height="6" rx="2" fill="#2b4232" />
      <Rect x="354" y="168" width="20" height="2" fill="#2b4232" />
      <Rect x="354" y="176" width="20" height="2" fill="#2b4232" />

      {/* neighbours on the pavement */}
      <Circle cx="30" cy="156" r="6.5" fill="#b59a84" />
      <Path d="M22 170 L38 170 L40 194 L20 194 Z" fill="#6d7f8a" />
      <Rect x="23" y="192" width="5" height="7" fill="#26302b" />
      <Rect x="31" y="192" width="5" height="7" fill="#26302b" />
      <Circle cx="58" cy="150" r="7" fill="#c2ab92" />
      <Path d="M49 165 L67 165 L69 194 L47 194 Z" fill="#8a6f5a" />
      <Rect x="50" y="192" width="6" height="7" fill="#26302b" />
      <Rect x="61" y="192" width="6" height="7" fill="#26302b" />

      {/* the worker */}
      <Circle cx="200" cy="118" r="8.5" fill="#b8a18a" />
      <Path d="M191 115 Q 200 104 209 115 Z" fill="#3d4b3c" />
      <Path d="M188 131 L212 131 L214 168 L186 168 Z" fill="#b09a59" stroke="#7b7750" strokeWidth="1" />
      <Rect x="183" y="133" width="6" height="28" rx="2" fill="#a18d62" />
      <Rect x="211" y="133" width="6" height="28" rx="2" fill="#a18d62" />
      <Rect x="190" y="166" width="8" height="28" fill="#293a32" />
      <Rect x="202" y="166" width="8" height="28" fill="#293a32" />
      <Rect x="188" y="192" width="11" height="6" rx="2" fill="#1d2622" />
      <Rect x="201" y="192" width="11" height="6" rx="2" fill="#1d2622" />

      {/* haze and vignette */}
      <Rect x="0" y="150" width="400" height="50" fill="#a9b79e" opacity="0.12" />
      <Rect x="0" y="0" width="400" height="260" fill="url(#vignette)" />
    </>
  );
}

function OfficeArt() {
  return (
    <>
      <Defs>
        <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3f4337" />
          <Stop offset="1" stopColor="#2b2d25" />
        </LinearGradient>
        <LinearGradient id="pane" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8d9a7f" />
          <Stop offset="1" stopColor="#58654f" />
        </LinearGradient>
        <LinearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7a6548" />
          <Stop offset="1" stopColor="#4a3d2b" />
        </LinearGradient>
        <LinearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e6dfb0" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#e6dfb0" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="folder" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8a6f50" />
          <Stop offset="1" stopColor="#5f4a33" />
        </LinearGradient>
        <RadialGradient id="vignetteO" cx="0.5" cy="0.45" r="0.75">
          <Stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </RadialGradient>
      </Defs>

      <Rect x="0" y="0" width="400" height="260" fill="url(#wall)" />
      {/* framed picture */}
      <Rect x="250" y="34" width="78" height="60" fill="#1b221e" stroke="#5f5f4b" strokeWidth="4" />
      <Rect x="262" y="46" width="54" height="36" fill="#55604e" />
      <Path d="M262 82 L278 60 L292 74 L304 62 L316 82 Z" fill="#3c4a3c" />

      {/* window and light beam */}
      <Rect x="26" y="26" width="104" height="128" fill="#3d483b" />
      <Rect x="36" y="36" width="84" height="108" fill="url(#pane)" />
      <Rect x="76" y="36" width="4" height="108" fill="#354133" />
      <Rect x="36" y="86" width="84" height="4" fill="#354133" />
      <Path d="M36 144 L120 144 L168 260 L0 260 Z" fill="url(#beam)" />

      {/* desk */}
      <Rect x="-10" y="190" width="420" height="22" fill="url(#desk)" />
      <Rect x="-10" y="190" width="420" height="3" fill="#8f7a58" />
      <Rect x="-10" y="212" width="420" height="60" fill="#3f3426" />

      {/* photograph */}
      <G rotation="-6" origin="121, 166">
        <Rect x="92" y="128" width="58" height="76" fill="#e0ddc8" />
        <Rect x="98" y="134" width="46" height="58" fill="#6d7068" />
        <Circle cx="121" cy="157" r="8" fill="#a9a496" />
        <Path d="M106 190 Q 121 166 136 190 Z" fill="#3a3d38" />
      </G>

      {/* folder and incident report */}
      <Rect x="180" y="168" width="58" height="22" rx="2" fill="url(#folder)" />
      <G rotation="8" origin="310, 172">
        <Rect x="276" y="136" width="70" height="78" fill="#d4cdb1" />
        <SvgText x="284" y="150" fill="#5b5e4d" fontSize="6.5" fontWeight="700" letterSpacing="0.8">INCIDENT REPORT</SvgText>
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <Rect key={i} x="284" y={160 + i * 7} width={i % 2 ? 46 : 56} height="2" fill={i === 4 ? '#6b6450' : '#aaa78e'} />
        ))}
      </G>

      <Rect x="0" y="0" width="400" height="260" fill="url(#vignetteO)" />
    </>
  );
}

export default function CedarArt({office = false}) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} preserveAspectRatio="xMidYMid slice">
      {office ? <OfficeArt /> : <StreetArt />}
    </Svg>
  );
}
