import { PatchHandData } from "@/features/hand/types/hand";
import { AUTH_COOKIE_NAME, decodeAuthToken } from "@/lib/auth-token";
import dbConnect from "@/lib/mongodb";
import HandGesture from "@/models/HandGesture";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const { id } = await params;
  const { gestureName, gestureText,landmark } = await request.json() as PatchHandData;
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userClaims = await decodeAuthToken(token);
  if (!userClaims) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const { id } = await params;
  const owning = await HandGesture.findOne({
    ownerId: { $eq: userClaims.userId },
    id:{$eq:id},
  });
  if (!owning) {
    return NextResponse.json({ message: 'not found' }, { status: 404 });
  }
  const deletedGesture = await HandGesture.deleteOne({ id: { $eq: id } });
  if (!deletedGesture) {
    return NextResponse.json({ message: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ message: "delete complete" });
}