export interface NewHandTypeRequest {
  handmode:number,
  gestureName:string,
  gestureText: string
}

export interface PatchHandData {
    id:string,
    gestureName:string,
    gestureText: string,
    landmark:number[]
}

// export interface UpdateHandData{
//     landmark:[number],
//     id:string
// }