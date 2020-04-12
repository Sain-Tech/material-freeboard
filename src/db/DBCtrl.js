/** 파이어베이스 관리자 설정 (DBCtrl.js 와 같은 경로에 FirebaseAdminConfig.js 파일 생성할 것)
 * @param id 마스터키 아이디(이메일 주소)
 * @param pw 마스터키 암호
 * @param apiConfig 파이어베이스 Config
 */
import { id, pw, apiConfig } from './FirebaseAdminConfig';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';
import 'firebase/analytics';
import 'firebase/storage';

/** 파이어베이스 초기화 및 초반 관리자 로그인 상태 */
// 파이어베이스 초기화
firebase.initializeApp(apiConfig);

// 마스터키로 관리자 로그인
/* firebase.auth().onAuthStateChanged(async (user) => {
    // 로그인한 사용자가 없으면 관리자로 로그인
    if (!user) {
        firebase
            .auth()
            .signInWithEmailAndPassword(id, pw)
            .catch((err) => {
                const errCode = err.code;
                const errMsg = err.message;
                console.error(errCode, errMsg);
                alert(`Firebase 마스터 인증 오류 발생!\n 에러 코드: ${errCode}\n 에러 내용: ${errMsg}`);
            });
    } else {
        // 세션 스토리지에도 저장함...
        console.log('saving current user at session storage...');
        if (await dbCtrl.userCurrent) {
            sessionStorage.setItem('currentUser', JSON.stringify({ stdno: user.displayName, name: (await dbCtrl.userCurrent)['name'] }));
        } else {
            sessionStorage.setItem('currentUser', null);
        }
    }
}); */
// 파이어베이스 실시간 데이터베이스 선언
const fbdb = firebase.database();
const storage = firebase.storage();

/** 필요한 각종 데이터베이스 함수 나열할 것 */
const dbCtrl = {
    /** 지원서 제출
     * @param sub 구분 카테고리
     * @param form 제출 데이터
     * @callback callback.onSuccess 제출 후 작업 콜백 함수
     * @callback callback.onError 제출 실패 시 콜백 함수
     */
    submitBooks(
        form = {
            ordName: '<성함>',
            ordAge: '<학년 또는 나이>',
            ordPhone: '<연락처>',
            ordEmail: '<이메일>',
            ordType: '<상담 유형>',
            ordService: '<상담 신청 서비스>',
            ordQuestion: '<상담하실 내용>',
        },
        callback = { onSuccess(res) {}, onError(err) {} },
    ) {
        const datetime = new Date();
        const timeserial = datetime.getTime();
        const year = datetime.getFullYear();
        const month = datetime.getMonth() + 1;
        const date = datetime.getDate();
        const hours = datetime.getHours();
        const minutes = datetime.getMinutes();
        const seconds = datetime.getSeconds();
        const datestr = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

        fbdb.ref(`/Books/${year}/${month}/${timeserial}&${form.ordPhone.replace(/-/gi, '')}`).set(
            {
                ordName: form.ordName,
                ordAge: form.ordAge,
                ordPhone: form.ordPhone,
                ordEmail: form.ordEmail,
                ordType: form.ordType,
                ordService: form.ordService,
                ordQuestion: form.ordQuestion,
                ordDateTime: datestr,
            },
            (err) => {
                if (err) {
                    callback.onError(err);
                } else {
                    callback.onSuccess(null);
                }
            },
        );
    },
};

export { dbCtrl, firebase, fbdb, storage };
