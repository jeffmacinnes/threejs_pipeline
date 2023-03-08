// *** General math functions to make certain, frequently used calculations easier for us

// get rand Float value between min, max (exclusive)
export const randBw = (min, max) => {
  return Math.random() * (max - min) + min;
};

// get rand Int value between min, max (inclusive)
export const randIntBw = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// get random value from supplied array
export const randFromArr = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// map input value to new range
export const remap = (val, inputMin, inputMax, outputMin, outputMax) => {
  return (outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin)) + outputMin;
};

// LERP: linear interpolation
export const lerp = (v0, v1, t) => {
  return v0 * (1 - t) + v1 * t;
};

// cosine interpolate between val1, val2, at progress (range 0-1)
export const cosineInterpolate = (val1, val2, progress) => {
  const m2 = (1 - Math.cos(progress * Math.PI)) / 2;
  return val1 * (1 - m2) + val2 * m2;
};

// clamp/constrain value to min/max range
export const clamp = (val, min, max) => {
  return Math.max(Math.min(val, max), min);
};

// given 1D index, return 2D indices based on given 2D array size
export const idx2D = (idx, xSize, ySize) => {
  let x = idx % xSize;
  let y = Math.floor(idx / ySize);
  return { x: x, y: y };
};

// given 2D index, return the corresponding 1D index
export const idx1D = (xIdx, yIdx, xSize) => {
  return xIdx + xSize * yIdx;
};

// convert degrees to radians
export const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// convert radians to degrees
export const rad2deg = (rad) => {
  return rad * (180 / Math.PI);
};

// get random color
export const getRandomColor = () => {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// test if number is between range (inclusive)
export const isBetween = (val, min, max) => {
  return val >= min && val <= max;
};

// shuffle array * https://stackoverflow.com/a/2450976/1293256
export const shuffle = (array) => {
  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

export const formatCurrency = (value, decimalPts = 0) => {
  // return string with appropriate suffix for currency (K, M, B, T, etc);
  value = Math.round(value);
  let nDigits = `${value}`.length;
  let suffix = '';
  if (nDigits > 3 && nDigits <= 6) {
    suffix = 'K';
    value = (value / 1_000).toFixed(decimalPts);
  } else if (nDigits > 6 && nDigits <= 9) {
    suffix = 'M';
    value = (value / 1_000_000).toFixed(decimalPts);
  } else if (nDigits > 9 && nDigits <= 12) {
    suffix = 'B';
    value = (value / 1_000_000_000).toFixed(decimalPts);
  } else if (nDigits > 12 && nDigits <= 15) {
    suffix = 'T';
    value = (value / 1_000_000_000_000).toFixed(decimalPts);
  }

  return `$${value}${suffix}`;
};

export const pad = (number, length) => {
  return `0000${number}`.slice(-length);
};
