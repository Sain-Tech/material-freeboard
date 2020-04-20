import React, { useState, useEffect } from 'react';
import { Link } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';

import Freeboard from '../components/Freeboard';
import BoardListViewer from '../components/BoardListViewer';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';
import 'firebase/analytics';
import 'firebase/storage';

import { apiConfig } from '../db/FirebaseAdminConfig';

firebase.initializeApp(apiConfig);

function Notice() {
    const boardsRef = firebase.database().ref('/BoardNotice');
    const [allLists, setAllLists] = useState([]);
    const [boardLists, setBoardLists] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagingCount, setPagingCount] = useState(10);

    const pagingDatas = (datas, currentPage, pagingCount) => {
        const dataKeys = Object.keys(datas).reverse();
        const datasResult = [];
        console.log(datas);
        // const { title, writer, writeDate, lastUpdated, attachFiles } = snapshot.val();
        for (let i = (currentPage - 1) * pagingCount; i < currentPage * pagingCount; i++) {
            if (!dataKeys[i]) break;
            const _currentKey = dataKeys[i];
            const _obj = {};
            const { title, writer, writeDate, lastUpdated, attachFiles } = datas[_currentKey];
            _obj.no = _currentKey;
            _obj.title = title;
            _obj.writer = writer;
            _obj.writeDate = writeDate;
            _obj.lastUpdated = lastUpdated;
            _obj.isAttachments = !!attachFiles || (!!attachFiles && JSON.parse(attachFiles).length > 0);
            datasResult.push(_obj);
        }
        setBoardLists(datasResult);
    };

    const onPageChange = (event, value) => {
        setCurrentPage(value);
        pagingDatas(allLists, value, pagingCount);
    };

    useEffect(() => {
        boardsRef.on('value', (snapshot) => {
            const datas = snapshot.val();
            setAllLists(datas);
            pagingDatas(datas, currentPage, pagingCount);
        });
    }, []);

    return (
        <>
            <Freeboard firebase={firebase} articleRef="/BoardNotice/" redirectAfter="/notice">
                여기에 목록이 표시됩니다.
                <BoardListViewer datas={boardLists} />
                <Link href="/notice/writeNew">새 글 쓰기</Link>
                <Pagination count={Math.ceil(Object.keys(allLists).length / pagingCount)} page={currentPage} onChange={onPageChange} />
            </Freeboard>
        </>
    );
}

export default React.memo(Notice);
