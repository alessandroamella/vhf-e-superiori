/**
 * @swagger
 *  components:
 *    schemas:
 *      QthData:
 *        type: object
 *        properties:
 *          address_components:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                long_name:
 *                  type: string
 *                short_name:
 *                  type: string
 *                types:
 *                  type: array
 *                  items:
 *                    type: string
 *          formatted_address:
 *            type: string
 *          geometry:
 *            type: object
 *            properties:
 *              location:
 *                type: object
 *                properties:
 *                  lat:
 *                    type: number
 *                  lng:
 *                    type: number
 *              location_type:
 *                type: string
 *              viewport:
 *                type: object
 *                properties:
 *                  northeast:
 *                    type: object
 *                    properties:
 *                      lat:
 *                        type: number
 *                      lng:
 *                        type: number
 *                  southwest:
 *                    type: object
 *                    properties:
 *                      lat:
 *                        type: number
 *                      lng:
 *                        type: number
 *          place_id:
 *            type: string
 *          plus_code:
 *            type: object
 *            properties:
 *              compound_code:
 *                type: string
 *              global_code:
 *                type: string
 *          types:
 *            type: array
 *            items:
 *              type: string
 */

export interface QthData {
    address_components: AddressComponent[];
    formatted_address: string;
    geometry: Geometry;
    place_id: string;
    plus_code: PlusCode;
    types: string[];
}

export interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

export interface Geometry {
    location: Location;
    location_type: string;
    viewport: Viewport;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface Viewport {
    northeast: Northeast;
    southwest: Southwest;
}

export interface Northeast {
    lat: number;
    lng: number;
}

export interface Southwest {
    lat: number;
    lng: number;
}

export interface PlusCode {
    compound_code: string;
    global_code: string;
}
