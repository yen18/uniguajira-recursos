import React from 'react';
import Lottie from 'lottie-react';

const AnimatedIcon = ({ 
  animationData, 
  width = 100, 
  height = 100, 
  loop = true, 
  autoplay = true,
  className = '',
  style = {},
  onComplete = null 
}) => {
  const options = {
    loop: loop,
    autoplay: autoplay,
    animationData: animationData,
    style: {
      width: width,
      height: height,
      ...style
    }
  };

  return (
    <div className={`animated-icon ${className}`}>
      <Lottie 
        {...options}
        onComplete={onComplete}
      />
    </div>
  );
};

export default AnimatedIcon;