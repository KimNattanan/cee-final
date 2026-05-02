import dbConnect from "@/lib/mongodb";
import { AUTH_COOKIE_NAME, decodeAuthToken } from "@/lib/auth-token";
import { NextRequest, NextResponse } from "next/server";
import HandGesture from "@/models/HandGesture";
import mongoose from "mongoose";
import { NewHandTypeRequest, PatchHandData } from "@/features/auth/types/hand";
export async function GET(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userClaims = await decodeAuthToken(token);
    if (!userClaims) {
        const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
    }
    await dbConnect();
    const handGesture = await HandGesture.find({ ownerId :{ $eq: userClaims.userId }  });
    return NextResponse.json({ data: handGesture});
}
export async function POST(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userClaims = await decodeAuthToken(token);
    if (!userClaims) {
        const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
    }
    await dbConnect();
    const { handmode, gestureName, gestureText } = await request.json() as NewHandTypeRequest;
    const existingName = await HandGesture.findOne({
      ownerId: { $eq: userClaims.userId },
        gestureName:{$eq: gestureName}
    });
    if (existingName) {
      return NextResponse.json({ message: 'this name already exists' }, { status: 400 });
    }
    const handGesture = await HandGesture.create({
        id: new mongoose.Types.ObjectId().toString(),
      ownerId: userClaims.userId,
      gestureName: gestureName,
      gestureText:gestureText,
      handmode:handmode,
      landmark:[]
    });
    return NextResponse.json({ message: "create complete" ,data : handGesture});
}
export async function PATCH(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userClaims = await decodeAuthToken(token);
    if (!userClaims) {
        const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
    }
    await dbConnect();
    const { id, gestureName, gestureText,landmark } = await request.json() as PatchHandData;
    const owning = await HandGesture.findOne({
      ownerId: { $eq: userClaims.userId },
      id:{$eq:id},
    });
    if (!owning) {
      return NextResponse.json({ message: 'not own' }, { status: 400 });
    }
    const update = {
        gestureName:gestureName,
        gestureText:gestureText,
    }
    const query:any = { $set: update}
    if(landmark!==undefined && landmark!==null){
        query.$push={
            landmark: landmark 
        }
    }
    Object.keys(update).forEach(key => 
        (update[key as keyof typeof update] === undefined || update[key as keyof typeof update] === "") && 
        delete update[key as keyof typeof update]
    );
    const updatedGesture = await HandGesture.updateOne(
      { id : {$eq : id}}, 
      query, 
      { runValidators: true }
    );
    // console.log(updatedGesture)
    // if(!updatedGesture){
    //     return NextResponse.json({ message: 'not found' }, { status: 400 });
    // }
    return NextResponse.json({ message: "patch complete"});
}


// export async function UPDATE(request: NextRequest) {
//     const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
//     if (!token) {
//         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }
//     const userClaims = await decodeAuthToken(token);
//     if (!userClaims) {
//         const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//         response.cookies.delete(AUTH_COOKIE_NAME);
//         return response;
//     }
//     await dbConnect();
//     const { id,landmark } = await request.json() as UpdateHandData;
//     console.log(id)
//     const owning = await HandGesture.findOne({
//       ownerId: { $eq: userClaims.userId },
//       id:{$eq:id},
//     });

//     if (!owning) {
//       return NextResponse.json({ message: 'not own' }, { status: 400 });
//     }
//     const updatedGesture = await HandGesture.updateOne(
//       { id : {$eq : id}}, 
//       { $push: { landmark: landmark } },  
//       { runValidators: true }
//     );
//     if(!updatedGesture){
//         return NextResponse.json({ message: 'not found' }, { status: 400 });
//     }
//     return NextResponse.json({ message: "patch complete"});
// }