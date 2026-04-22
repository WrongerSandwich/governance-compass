/**
 * Minimal type declarations for react-simple-maps@3
 * The package does not ship TypeScript types; these cover the API surface used
 * by WorldMap.tsx.
 */
declare module "react-simple-maps" {
  import type { FC, ReactNode, SVGProps } from "react";

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    className?: string;
    children?: ReactNode;
  }

  export const ComposableMap: FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    parseGeographies?: (geographies: unknown[]) => unknown[];
    children: (props: { geographies: GeoItem[] }) => ReactNode;
    className?: string;
  }

  export interface GeoItem {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: unknown;
    [key: string]: unknown;
  }

  export const Geographies: FC<GeographiesProps>;

  export interface GeographyStyleSpec {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    opacity?: number;
    cursor?: string;
    pointerEvents?: string;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeoItem;
    tabIndex?: number;
    "aria-label"?: string;
    "aria-selected"?: boolean;
    "aria-hidden"?: boolean;
    role?: string;
    style?: {
      default?: GeographyStyleSpec;
      hover?: GeographyStyleSpec;
      pressed?: GeographyStyleSpec;
    };
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<SVGPathElement>) => void;
    className?: string;
  }

  export const Geography: FC<GeographyProps>;

  export const Marker: FC<{
    coordinates: [number, number];
    children?: ReactNode;
    [key: string]: unknown;
  }>;

  export const Graticule: FC<{ [key: string]: unknown }>;
  export const Sphere: FC<{ [key: string]: unknown }>;
  export const Line: FC<{ [key: string]: unknown }>;
  export const Annotation: FC<{ [key: string]: unknown }>;

  export function useGeographies(props: {
    geography: string | object;
    parseGeographies?: (geographies: unknown[]) => unknown[];
  }): { geographies: GeoItem[]; loading: boolean; error: unknown };

  export function useMapContext(): unknown;
  export function useZoomPan(): unknown;
}
