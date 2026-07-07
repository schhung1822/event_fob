import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="notes">♪♪♪♪♪</div>
        <div className="notes">♪♪♪♪</div>
        <div className="notes">♪♪♪♪♪</div>
        <div className="header">
          TICKET
          <div className="symbol">✁</div>
        </div>
        <div className="body">
          <em>Day pass</em><br />
          May 14<sup>th</sup> 2026<br />
          Venue address, State, #####
        </div>
        <div className="footer">
          <div className="number">Seat <span className="bold">E7</span></div>
          <div className="barcode" />
        </div>
        <div className="bg holographic" />
        <svg className="filter">
          <filter id="bump">
            <feTurbulence result="noise" numOctaves={3} baseFrequency="0.7" type="fractalNoise" />
            <feSpecularLighting in="noise" result="specular" lightingColor="#fffffc" specularExponent={25} specularConstant="0.8" surfaceScale="0.15">
              <fePointLight z={210} y={100} x={100} />
            </feSpecularLighting>
            <feComposite result="noise2" operator="in" in="specular" in2="SourceGraphic" />
            <feBlend mode="screen" in2="noise2" in="SourceGraphic" />
          </filter>
        </svg>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    --width: 180px;
    --height: 320px;
    --perforation-size: 12px;
    --cutouts-adjust: 70px;

    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 1rem;
    grid-template-areas:
      "header"
      "body"
      "footer";

    width: var(--width);
    height: var(--height);
    padding: var(--perforation-size) 0;

    font-family: "Inter", sans-serif;
    font-size: 1rem;
    user-select: none;
    overflow: hidden;

    filter: drop-shadow(0 2px 1px #00000025) drop-shadow(0 4px 3px #00000025)
      drop-shadow(0 10px 9px #00000025) drop-shadow(0 20px 20px #00000025)
      drop-shadow(0 40px 40px #00000025);
    animation: hover 3s ease infinite;
    will-change: transform, filter;
  }

  @keyframes hover {
    50% {
      filter: drop-shadow(0 4px 3px #00000015) drop-shadow(0 6px 6px #00000015)
        drop-shadow(0 16px 14px #00000015) drop-shadow(0 30px 28px #00000015)
        drop-shadow(0 60px 60px #00000015);
      transform: translateY(-7px) scale(1.02);
    }
  }

  .filter {
    position: absolute;
  }

  .bg {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: #fff;
    filter: url(#bump);
    mask:
      /* top perforations */
      radial-gradient(
        circle at 50% 0,
        #fff0 calc(var(--perforation-size) - 5px),
        #000 calc(var(--perforation-size) - 4px)
      ),
      /* bottom perforations */
        radial-gradient(
          circle at 50% 100%,
          #fff0 calc(var(--perforation-size) - 5px),
          #000 calc(var(--perforation-size) - 4px)
        ),
      /* left notch */
        radial-gradient(circle 8px at left center, #000 98%, #0000 100%),
      /* right notch */
        radial-gradient(circle 8px at right center, #000 98%, #0000 100%),
      /* cut perforation */
        repeating-linear-gradient(
          90deg,
          #000 10px,
          #000 15px,
          #0000 16px,
          #0000 24px
        );

    mask-repeat: repeat-x, repeat-x, no-repeat, no-repeat, repeat-x;

    mask-size:
      calc(var(--perforation-size) * 2) 100%,
      calc(var(--perforation-size) * 2) 100%,
      16px 16px,
      16px 16px,
      10px 2px;

    mask-position:
      calc(0.5 * var(--perforation-size)) top,
      calc(0.5 * var(--perforation-size)) bottom,
      left var(--cutouts-adjust),
      right var(--cutouts-adjust),
      0 calc(var(--cutouts-adjust) + 7px);

    mask-composite: intersect, exclude, add, add;
  }

  .holographic {
    background-image: linear-gradient(to bottom, #fe58, 90%, #0002),
      conic-gradient(
        at 60% 50%,
        #ccc,
        #ff6bfe,
        #00f9f8,
        #ddd,
        #0081fd,
        #eef0bc,
        #0081fd,
        #ff6bfe,
        #0002,
        #0081fd,
        #ddd,
        #01fefb,
        #ccc
      );
  }
  .holographic::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(circle at 70% 20%, #f0f, #0000),
      repeating-radial-gradient(circle at 30% 80%, #fff, #f4a 48px, #eeeeee 150px);
    mix-blend-mode: color-burn;
  }
  .holographic::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(to bottom, #f205, #f00, #0f0, #f205);
    mix-blend-mode: difference;

    animation: bg-pos 3s ease-in-out infinite alternate;
    background-position: 0 0;
    background-size: 100% 300%;
    background-repeat: repeat;
  }

  @keyframes bg-pos {
    to {
      background-position: 0 500px;
    }
  }

  .header {
    position: relative;
    grid-area: header;
    margin: 0 8px;
    text-align: center;
    z-index: 1;
    font-family: "Impact", sans-serif;
    font-size: 2.75rem;
    letter-spacing: 2px;
    color: #ffffff9f;
    text-shadow: 0 0 0 #000;
    -webkit-text-stroke: #fff 0.5px;
    mix-blend-mode: difference;
  }

  .body {
    grid-area: body;
    margin: 0 1em;
    padding: 0.5em;
    font-weight: 200;
    z-index: 1;
  }

  .footer {
    grid-area: footer;
    z-index: 1;

    margin: 0 1em 1em 1em;
  }

  .number {
    margin-bottom: 0.75rem;
    text-align: center;
    border-radius: 999px 0;
    color: #000;
    font-weight: 200;
    .bold {
      font-weight: 600;
    }
  }

  .barcode {
    justify-self: center;
    width: 0;
    height: 32px;
    box-shadow:
      0px 0 0 1px #000,
      5px 0 0 1px #000,
      7px 0 0 1px #000,
      11px 0 0 1px #000,
      15px 0 0 1px #000,
      16px 0 0 1px #000,
      22px 0 0 1px #000,
      27px 0 0 1px #000,
      30px 0 0 1px #000,
      35px 0 0 1px #000,
      36px 0 0 1px #000,
      39px 0 0 1px #000,
      43px 0 0 1px #000,
      47px 0 0 1px #000,
      50px 0 0 1px #000,
      55px 0 0 1px #000,
      59px 0 0 1px #000,
      60px 0 0 1px #000,
      64px 0 0 1px #000,
      69px 0 0 1px #000,
      70px 0 0 1px #000,
      74px 0 0 1px #000;
    transform: translateX(37px);
  }

  .symbol {
    position: absolute;
    top: 1.3em;
    right: 0px;
    rotate: 185deg;
    font-size: 1.1em;
    color: #fff;
    line-height: 0.5;
    opacity: 0.2;
  }
  .notes {
    position: absolute;
    inset: 0;
    overflow: hidden;
    font-size: 5rem;
    color: #e7e7e7;
    mix-blend-mode: color-burn;
    transform: translateY(20%);
    z-index: 1;
  }
  .notes:nth-child(2) {
    transform: translateY(40%);
  }
  .notes:nth-child(3) {
    transform: translateY(60%);
  }`;

export default Card;
