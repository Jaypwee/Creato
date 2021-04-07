// May Change in Future
const mediaQuery = (maxWidth: number): string => {
  return `@media (max-width: ${maxWidth}px)`;
};

const media = {
  custom: mediaQuery,
  desktop: mediaQuery(1024),
  phone: mediaQuery(576),
  tablet: mediaQuery(768)
};

export default media;
