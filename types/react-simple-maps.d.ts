declare module "react-simple-maps" {
  import { ComponentType, ReactNode, CSSProperties } from "react";

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    className?: string;
    children?: ReactNode;
  }
  export const ComposableMap: ComponentType<ComposableMapProps>;

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;

  interface GeographiesChildArgs {
    geographies: Array<{
      rsmKey: string;
      id: string;
      properties: Record<string, string>;
    }>;
  }
  interface GeographiesProps {
    geography: string | object;
    children: (args: GeographiesChildArgs) => ReactNode;
  }
  export const Geographies: ComponentType<GeographiesProps>;

  interface GeoStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
    opacity?: number;
  }
  interface GeographyProps {
    geography: GeographiesChildArgs["geographies"][number];
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
    style?: {
      default?: GeoStyle;
      hover?: GeoStyle;
      pressed?: GeoStyle;
    };
    className?: string;
  }
  export const Geography: ComponentType<GeographyProps>;

  interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
  }
  export const Marker: ComponentType<MarkerProps>;
}
