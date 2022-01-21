/* eslint-disable no-eval */
/* eslint-disable no-param-reassign */
/* eslint-disable eqeqeq */

module.exports = {
  and: (v1, v2) => v1 && v2,
  or: (v1, v2) => v1 || v2,
  eq: (v1, v2) => v1 === v2,
  eqp: (v1, v2) => v1 == v2,
  ne: (v1, v2) => v1 !== v2,
  nep: (v1, v2) => v1 != v2,
  lt: (v1, v2) => v1 < v2,
  gt: (v1, v2) => v1 > v2,
  lte: (v1, v2) => v1 <= v2,
  gte: (v1, v2) => v1 >= v2,
  sum: (v1, v2) => v1 + v2,
  sub: (v1, v2) => v1 - v2,
  div: (v1, v2) => v1 / v2,
  mul: (v1, v2) => v1 * v2,
  mod: (v1, v2) => v1 % v2,
  json: (v1) => JSON.stringify(v1),
  eval: (...params) => eval(params.slice(0, -1).join('')),
  prop: (v1, prop) => v1[prop],
  times: (n, options) => {
    let accum = '';
    for (let i = 0; i < n; i += 1) {
      options.data.index = i;
      options.data.first = i === 0;
      options.data.last = i === (n - 1);
      accum += options.fn(this);
    }
    return accum;
  },
  for: (from, to, incr, options) => {
    let accum = '';
    if (incr > 0) {
      for (let i = from; i <= to; i += incr) {
        options.data.index = i;
        options.data.first = i === from;
        options.data.last = i === to;
        accum += options.fn(this);
      }
    } else {
      for (let i = from; i >= to; i += incr) {
        options.data.index = i;
        options.data.first = i === from;
        options.data.last = i === to;
        accum += options.fn(this);
      }
    }
    return accum;
  },
  includes: (v1, v2) => (v1 ? v1.includes(v2) : false),
  substring: (v1, v2 = 0, v3 = 0) => (typeof v1 === 'string' ? v1.substring(v2, v3) : ''),
  substr: (v1, v2 = 0, v3 = 0) => (typeof v1 === 'string' ? v1.substr(v2, v3) : ''),
  slug: (v1) => {
    if (typeof v1 !== 'string') return '';
    return v1.toString() // Convert to string
      .normalize('NFD') // Change diacritics
      .replace(/[\u0300-\u036f]/g, '') // Remove illegal characters
      .replace(/\s+/g, '-') // Change whitespace to dashes
      .toLowerCase() // Change to lowercase
      .replace(/&/g, '-and-') // Replace ampersand
      .replace(/[^a-z0-9-]/g, '') // Remove anything that is not a letter, number or dash | /[^a-z0-9\-]/g
      .replace(/-+/g, '-') // Remove duplicate dashes
      .replace(/^-*/, '') // Remove starting dashes
      .replace(/-*$/, ''); // Remove trailing dashes
  },
};
