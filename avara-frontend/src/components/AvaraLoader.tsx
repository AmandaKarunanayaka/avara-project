import React from "react";
import styled from "styled-components";
import "/src/css/carousel.css";

const AvaraLoader: React.FC = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <span className="name-loader">AVARA</span>
        <span className="name-loader">AVARA</span>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .loader {
    align-items: center;
    justify-content: center;
  }

  .loader span {
    position: absolute;
    transform: translate(-50%, -50%);
    font-size: 42px;
    letter-spacing: 6px;
    font-weight: 600;
    left: 50%;
    top: 50%;
  }

  .loader span:nth-child(1) {
    color: transparent;
    -webkit-text-stroke: 1.2px #eab308;
    opacity: 0.85;
  }

  .loader span:nth-child(2) {
    color: #eab308;
    -webkit-text-stroke: 1px #eab308;
    animation: avaraGoldWave 3s ease-in-out infinite;
  }

  @keyframes avaraGoldWave {
    0%,
    100% {
      clip-path: polygon(
        0% 45%,
        15% 44%,
        32% 50%,
        54% 60%,
        70% 61%,
        84% 59%,
        100% 52%,
        100% 100%,
        0% 100%
      );
    }

    50% {
      clip-path: polygon(
        0% 60%,
        16% 65%,
        34% 66%,
        51% 62%,
        67% 50%,
        84% 45%,
        100% 46%,
        100% 100%,
        0% 100%
      );
    }
  }
`;

export default AvaraLoader;
