// Firebase 인증 & 사용자 정보 서비스
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserType } from '../types';

// 회원가입 함수
export async function registerWithEmail(
  email: string,
  pass: string,
  nickname: string,
  userType: UserType,
  orgCode?: string
): Promise<UserProfile> {
  try {
    // 1. Firebase Auth 계정 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. 프로필 객체 생성 (leeyob@gmail.com은 어드민 권한 부여)
    const isAdmin = email.trim().toLowerCase() === 'leeyob@gmail.com';
    const profileData: any = {
      id: user.uid,
      email: user.email || email,
      nickname,
      userType: isAdmin ? 'PARAMEDIC' : userType,
      isAdmin,
      createdAt: serverTimestamp(),
    };

    // undefined 필드 제거 (Firestore는 undefined를 지원하지 않음)
    if (orgCode) profileData.orgCode = orgCode;

    // 3. Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', user.uid), profileData);
    
    return {
      ...profileData,
      createdAt: new Date().toISOString(),
    } as UserProfile;
  } catch (error: any) {
    console.error('회원가입 상세 에러:', {
      code: error.code,
      message: error.message,
      full: error
    });
    
    // 에러 메시지 한글 변환
    let message = '회원가입에 실패했습니다.';
    if (error.code === 'auth/email-already-in-use') message = '이미 사용 중인 이메일입니다.';
    else if (error.code === 'auth/weak-password') message = '비밀번호는 6자리 이상이어야 합니다.';
    else if (error.code === 'auth/invalid-email') message = '유효하지 않은 이메일 형식입니다.';
    else if (error.code === 'auth/operation-not-allowed') message = '이메일/비밀번호 로그인이 활성화되어 있지 않습니다. (Firebase 콘솔 확인 필요)';
    
    throw new Error(`${message}\n(${error.code || 'unknown'})`);
  }
}

// 로그인 함수
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  try {
    // 1. Firebase Auth로 로그인
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Firestore에서 사용자 프로필 정보 가져오기
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: user.uid,
        email: data.email,
        nickname: data.nickname,
        userType: data.userType,
        orgCode: data.orgCode,
        isAdmin: data.isAdmin || data.email === 'leeyob@gmail.com',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    } else {
      throw new Error('사용자 프로필 정보가 없습니다.');
    }
  } catch (error: any) {
    console.error('로그인 에러:', error);
    let message = '로그인에 실패했습니다.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    throw new Error(message);
  }
}

// 로그아웃 함수
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw new Error('로그아웃에 실패했습니다.');
  }
}

// 프로필 가져오기 (세션 복구 시 사용)
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: uid,
        email: data.email,
        nickname: data.nickname,
        userType: data.userType,
        orgCode: data.orgCode,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    }
    return null;
  } catch (error) {
    console.error('프로필 로드 에러:', error);
    return null;
  }
}
