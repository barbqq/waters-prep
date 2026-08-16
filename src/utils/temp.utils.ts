export function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}

export function celsiusToKelvin(celsius: number): number {
  return Number((celsius + 273.15).toFixed(2));
}
