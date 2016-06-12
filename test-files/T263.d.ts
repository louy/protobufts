export namespace services {
  export interface resume {
  }
  export namespace resume {
    export interface Resume {
      experience: string[];
    }
  }

  export interface profile {
  }
  export namespace profile {
    export interface Profile {
      resume?: services.resume.Resume;
    }
  }
}
