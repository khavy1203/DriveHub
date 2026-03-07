export interface ApiResponse {
  EC: number; // Error Code
  EM: string; // Error Message
  DT: any[];      // Data
}

export interface ApiResponseLogin {
  EC: number; // Error Code
  EM: string; // Error Message
  DT: {
    access_token: string,
    groupWithRoles: {
      id: number;
      name: string ;
      description: string ;
      roles: [] | null
    },
    email: string,
    username: string
  }
}



export interface ApiEndpoints {
  [key: string]: {
    [method: string]: {
      [action: string]: string;
    };
  };
}