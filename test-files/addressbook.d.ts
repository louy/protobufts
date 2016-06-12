export namespace tutorial {
  export interface Person {
    name?: string;
    id?: number;
    email?: string;
    phones: Person.PhoneNumber[];
  }
  export namespace Person {
    export enum PhoneType {
      MOBILE = 0,
      HOME = 1,
      WORK = 2,
    }
    export interface PhoneNumber {
      number?: string;
      type?: PhoneType;
    }
  }

  export interface AddressBook {
    people: Person[];
  }
}
