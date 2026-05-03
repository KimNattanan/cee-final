export interface NewHandTypeRequest {
  handmode:number,
  gestureName:string,
  gestureText: string
}

export interface PatchHandData {
    id:string,
    gestureName?:string,
    gestureText?: string,
    landmark?:number[]
}

export interface HandGestureResponse {
  id: string;
  ownerId: string;
  handmode: number;
  gestureName: string;
  gestureText: string;
  landmark: number[][];
  createdAt: Date;
  updatedAt: Date;
}

// export interface UpdateHandData{
//     landmark:[number],
//     id:string
// }