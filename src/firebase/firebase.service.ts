import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
import * as serviceAccount from '../firebase/serviceAccountKey.json'; // 다운로드한 서비스 계정 키

@Injectable()
export class FirebaseService {
  private firestore: FirebaseFirestore.Firestore;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
    this.firestore = admin.firestore();
  }

  getDb() {
    return this.firestore;
  }
}
