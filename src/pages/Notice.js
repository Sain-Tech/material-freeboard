import React from 'react';
import Freeboard from '../components/Freeboard';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';
import 'firebase/analytics';
import 'firebase/storage';

import { Route } from 'react-router-dom';

import { id, pw, apiConfig } from '../db/FirebaseAdminConfig';
import { Link } from '@material-ui/core';

firebase.initializeApp(apiConfig);

function Notice() {
    return (
        <>
            <Freeboard firebase={firebase} redirectAfter="/notice">
                여기에 목록이 표시됩니다.
                <Link href="/notice/writeNew">새 글 쓰기</Link>
            </Freeboard>
        </>
    );
}

export default Notice;
