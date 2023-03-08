// Set of utilities for building animations
export const clipPath = {
  /*  Define clipping masks
        Each mask is an array of x,y points (in percent) that define the polygon for that clipping path
        - 'show' is a polygon rectangle the same size as the div
        - 'hide_x0' is a full height polygon with 0 width, positioned on LEFT
        - 'hide_x1' is a full height polygon with 0 width, positioned on RIGHT
        - 'hide_y0' is a full width polygon with 0 width, positioned on TOP
        - 'hide_y1' is a full height polygon with 0 width, positioned on BOTTOM

    */
  show: [0, 0, 100, 0, 100, 100, 0, 100],
  showHalf_x: [0, 0, 50, 0, 50, 100, 0, 100],
  hide_x0: [0, 0, 0, 0, 0, 100, 0, 100],
  hide_x1: [100, 0, 100, 0, 100, 100, 100, 100],
  hide_y0: [0, 0, 100, 0, 0, 0, 100, 0],
  hide_y1: [0, 100, 100, 100, 0, 100, 100, 100]
};

export const makeClipPoly = (arr) => {
  // take values in 'arr' and generate a string defining the polygon clipping path in percents
  let pt1 = `${arr[0]}% ${arr[1]}%`;
  let pt2 = `${arr[2]}% ${arr[3]}%`;
  let pt3 = `${arr[4]}% ${arr[5]}%`;
  let pt4 = `${arr[6]}% ${arr[7]}%`;

  return `polygon(${pt1}, ${pt2}, ${pt3}, ${pt4})`;
};
