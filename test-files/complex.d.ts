export namespace Game.Cars {
  export interface Car {
    model: string;
    vendor: Car.Vendor;
    speed?: Car.Speed;
  }
  export namespace Car {
    export enum Speed {
      FAST = 1,
      SUPERFAST = 2,
    }
    export interface Vendor {
      name: string;
      address?: Vendor.Address;
      models: string[];
    }
    export namespace Vendor {
      export interface Address {
        country: string;
      }
    }

    export interface Holder {
      first_name?: string;
      last_name: string;
      address?: Vendor.Address;
    }
  }
}
