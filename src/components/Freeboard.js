import React, { useState, useEffect, useRef } from 'react';

import ReactHtmlParser from 'react-html-parser';

import { Button, Grid, Link, TextField } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/styles';

import ReactQuill, { Quill } from 'react-quill';

import ImageResize from 'quill-image-resize-module-react';
import { ImageDrop } from 'quill-image-drop-module';
import { ImageUpload } from 'quill-image-upload';

import { Link as ReactLink, useHistory, useLocation, BrowserRouter } from 'react-router-dom';

import 'react-quill/dist/quill.snow.css';

Quill.register('modules/imageUpload', ImageUpload);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/imageDrop', ImageDrop);

const useStyles = makeStyles((theme) => ({
    root: {
        height: '100%',
        fontFamily: "'Noto Sans KR', sans-serif",
    },
    titleContainer: {
        marginTop: 8,
    },
    editorContainer: {
        height: '100%',
        marginTop: 8,
    },
    attachFilesContainer: {
        marginTop: 8,
    },
    actionButtonsContainer: {
        marginTop: 8,
    },
    gotoListContainer: {
        float: 'right',
    },
}));

const EdTitle = withStyles((theme) => ({
    root: {
        '& .MuiOutlinedInput-root': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            fontSize: 18,
        },
    },
}))(TextField);

const EdAttachFilesTextField = withStyles((theme) => ({
    root: {
        '& .MuiOutlinedInput-root': {
            borderTopLeftRadius: 0,
            // borderTopRightRadius: 0,
        },
    },
}))(TextField);

function Freeboard({ firebase, articleNo, articleRef, articleWriter, quillBounds, quillFormats, quillModules, redirectAfter, children }) {
    const classes = useStyles();
    const history = useHistory();

    const [title, setTitle] = useState('');
    const [titleBefore, setTitleBefore] = useState('');
    const [isTitleUpdated, setTitleUpdated] = useState(false);
    const [contents, setContents] = useState('');
    const [contentsBefore, setContentsBefore] = useState('');
    const [isContentsUpdated, setContentsUpdated] = useState(false);
    const [files, setFiles] = useState([]);
    const [filesBefore, setFilesBefore] = useState([]);
    const [isFilesUpdated, setFilesUpdated] = useState(false);
    const [originalWriter, setOriginalWriter] = useState('');

    articleNo = articleNo.replace(redirectAfter, '');
    articleNo = articleNo.replace('/', '');
    // console.log(articleNo);

    const [editMode, setEditMode] = useState(articleNo === 'writeNew' ? true : false);

    const titleElem = useRef();
    const quillElem = useRef();
    const hiddenInput = useRef();

    window.quill = quillElem.current;

    const database = firebase.database();
    const storage = firebase.storage();

    quillModules.imageUpload.customUploader = (file, returnTo) => {
        const timeserial = new Date().getTime();
        const imageUploadTask = storage.ref(`images/${timeserial}/${file.name}`).put(file);
        imageUploadTask.on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                // console.log(`Progress: ${progress}%`);
                if (snapshot.state === firebase.storage.TaskState.RUNNING) {
                    // console.log('image uploading...');
                }
            },
            (err) => {
                alert('이미지를 업로드 중 에러가 발생했습니다.\n' + err.code);
                console.error(err.code);
            },
            async () => {
                const downloadURL = await imageUploadTask.snapshot.ref.getDownloadURL();
                returnTo(downloadURL);
            },
        );
    };

    const onTitleChange = (e) => {
        // console.log(e.target.value);
        setTitle(e.target.value);
        if (titleBefore !== title) {
            // console.warn('title is updated');
            setTitleUpdated(true);
        } else {
            // console.log('title is same with before');
            setTitleUpdated(false);
        }
    };

    const onEditorChange = (html) => {
        // console.log(html);
        setContents(html);
        if (contentsBefore !== contents) {
            // console.warn('contents is updated');
            setContentsUpdated(true);
        } else {
            // console.log('contents is same with before');
            setContentsUpdated(false);
        }
    };

    const onAttachFileClick = (e) => {
        e.preventDefault();
        hiddenInput.current.click();
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    const onAttachFilesChange = ({ currentTarget }) => {
        //console.log(fs.currentTarget.files);
        const originals = currentTarget.files;
        const filesArr = [];
        Object.keys(originals).forEach((fkey) => {
            filesArr.push(originals[fkey]);
        });
        // console.log(filesArr);
        setFiles(filesArr);
        setContents(quillElem.current.getEditorContents());
        // setFilesUpdated(true);
        console.warn('attachment files updated');
    };

    const handlePositive = () => {
        if (editMode) {
            // 새 글 작성 버튼 누른 경우
            if (articleNo === 'writeNew') {
                if (title.trim() === '') {
                    alert('제목은 필수입니다.');
                    return;
                } else {
                    const conf = window.confirm('이 글을 게시하시겠습니까?');
                    if (!conf) {
                        return;
                    }
                }

                const datetime = new Date();
                const newArticleNum = datetime.getTime();
                const year = datetime.getFullYear();
                const month = datetime.getMonth() + 1;
                const date = datetime.getDate();
                const hours = datetime.getHours();
                const minutes = datetime.getMinutes();
                const seconds = datetime.getSeconds();
                const datestr = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

                const newContents = quillElem.current.getEditorContents();

                database.ref(articleRef + newArticleNum).set(
                    {
                        title: title,
                        contents: newContents,
                        writer: articleWriter,
                        writeDate: datestr,
                        lastUpdated: datestr,
                        attachFiles: null,
                    },
                    (err) => {
                        if (err) {
                            alert('글 업로드 중 오류가 발생했습니다.\n' + err);
                            console.err(err);
                        } else {
                            console.log('글 번호 ' + newArticleNum + ' 가 새롭게 등록됨');
                            const promises = [];
                            files.forEach((file) => {
                                const uploadTask = firebase.storage().ref().child(`attachments/${newArticleNum}/${file.name}`).put(file);
                                promises.push(uploadTask);
                                uploadTask.on(
                                    firebase.storage.TaskEvent.STATE_CHANGED,
                                    (snapshot) => {
                                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                        // console.log(`Progress: ${progress}%`);
                                        if (snapshot.state === firebase.storage.TaskState.RUNNING) {
                                            // console.log(file.name + ' uploading...');
                                        }
                                    },
                                    (err) => {
                                        alert(`첨부 파일 ${file.name} 을(를) 업로드 하는 중 에러가 발생했습니다.\n` + err.code);
                                        console.log(err.code);
                                    },
                                    async () => {
                                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                                    },
                                );
                            });
                            Promise.all(promises)
                                .then(async () => {
                                    const attachFiles = [];
                                    storage
                                        .ref()
                                        .child(`attachments/${newArticleNum}`)
                                        .listAll()
                                        .then(async ({ items }) => {
                                            for (let i = 0; i < items.length; i++) {
                                                const link = await items[i].getDownloadURL();
                                                const _obj = {};
                                                _obj.name = items[i].name;
                                                _obj.link = link;
                                                attachFiles.push(_obj);
                                            }
                                            // console.log(attachFiles);
                                            const updateData = {};
                                            updateData.attachFiles = JSON.stringify(attachFiles);
                                            database
                                                .ref(articleRef + newArticleNum)
                                                .update(updateData)
                                                .then(() => {
                                                    console.log('글 번호 ' + newArticleNum + ' 의 첨부 파일이 추가됨');
                                                    // alert('새 글이 등록되었습니다.');
                                                    window.location.replace(newArticleNum);
                                                })
                                                .catch((err) => {
                                                    alert('글에 첨부 파일을 등록하는 중 에러가 발생했습니다.\n' + err.code);
                                                    console.log(err.code);
                                                });
                                        });
                                })
                                .catch((err) => {
                                    alert('첨부 파일 업로드에 실패했습니다.');
                                    console.log(err.code);
                                });
                        }
                    },
                );
                // 글 수정 버튼 누른 경우
            } else {
                if (title.trim() === '') {
                    alert('제목은 필수입니다.');
                    return;
                } else {
                    const conf = window.confirm('정말로 이 글을 수정하시겠습니까?');
                    if (!conf) {
                        return;
                    }
                }

                const datetime = new Date();
                // const newArticleNum = datetime.getTime();
                const year = datetime.getFullYear();
                const month = datetime.getMonth() + 1;
                const date = datetime.getDate();
                const hours = datetime.getHours();
                const minutes = datetime.getMinutes();
                const seconds = datetime.getSeconds();
                const datestr = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

                const updateData = {};

                updateData.lastUpdated = datestr;

                const newContents = quillElem.current.getEditorContents();
                // console.log(newContents);

                if (isTitleUpdated) updateData.title = title;
                if (contents !== newContents) updateData.contents = newContents;

                database
                    .ref(articleRef + articleNo)
                    .update(updateData)
                    .then(() => {
                        if (files !== filesBefore) {
                            console.log('첨부 파일 삭제 후 재 업로드 합니다.');
                            const delPromises = [];
                            storage
                                .ref()
                                .child(`attachments/${articleNo}`)
                                .listAll()
                                .then(async ({ items }) => {
                                    items.forEach((file) => {
                                        const deleteTask = file.delete();
                                        delPromises.push(deleteTask);
                                    });
                                    Promise.all(delPromises)
                                        .then(() => {
                                            console.log('모든 첨부 파일 삭제 됨');
                                            const promises = [];
                                            files.forEach((file) => {
                                                const uploadTask = firebase
                                                    .storage()
                                                    .ref()
                                                    .child(`attachments/${articleNo}/${file.name}`)
                                                    .put(file);
                                                promises.push(uploadTask);
                                                uploadTask.on(
                                                    firebase.storage.TaskEvent.STATE_CHANGED,
                                                    (snapshot) => {
                                                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                                        // console.log(`Progress: ${progress}%`);
                                                        if (snapshot.state === firebase.storage.TaskState.RUNNING) {
                                                            // console.log(file.name + ' uploading...');
                                                        }
                                                    },
                                                    (err) => {
                                                        alert(
                                                            `첨부 파일 ${file.name} 을(를) 업로드 하는 중 에러가 발생했습니다.\n` +
                                                                err.code,
                                                        );
                                                        console.log(err.code);
                                                    },
                                                    async () => {
                                                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                                                    },
                                                );
                                            });
                                            Promise.all(promises)
                                                .then(async () => {
                                                    const attachFiles = [];
                                                    storage
                                                        .ref()
                                                        .child(`attachments/${articleNo}`)
                                                        .listAll()
                                                        .then(async ({ items }) => {
                                                            for (let i = 0; i < items.length; i++) {
                                                                const link = await items[i].getDownloadURL();
                                                                const _obj = {};
                                                                _obj.name = items[i].name;
                                                                _obj.link = link;
                                                                attachFiles.push(_obj);
                                                            }
                                                            // console.log(attachFiles);
                                                            const updateFileData = {};
                                                            updateFileData.attachFiles = JSON.stringify(attachFiles);
                                                            database
                                                                .ref(articleRef + articleNo)
                                                                .update(updateFileData)
                                                                .then(() => {
                                                                    console.log('글 번호 ' + articleNo + ' 의 첨부 파일이 수정됨');
                                                                    alert('글이 수정되었습니다.');
                                                                    setTitle(title);
                                                                    setTitleBefore(title);
                                                                    setContents(newContents);
                                                                    setContentsBefore(newContents);
                                                                    setFiles(attachFiles);
                                                                    setFilesBefore(attachFiles);
                                                                    setEditMode(false);
                                                                })
                                                                .catch((err) => {
                                                                    alert('글에 첨부 파일을 수정하는 중 에러가 발생했습니다.\n' + err.code);
                                                                    console.log(err.code);
                                                                });
                                                        });
                                                })
                                                .catch((err) => {
                                                    alert('첨부 파일 업로드에 실패했습니다.');
                                                    console.log(err.code);
                                                });
                                        })
                                        .catch((err) => {
                                            alert('첨부 파일 삭제에 실패했습니다.');
                                            console.log(err.code);
                                        });
                                });
                        } else {
                            alert('글이 수정되었습니다.');
                            setTitle(title);
                            setTitleBefore(title);
                            setContents(newContents);
                            setContentsBefore(newContents);
                            setEditMode(false);
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        } else {
            if (articleWriter === originalWriter) {
                setEditMode(true);
            } else {
                alert('글 작성자만 수정이 가능합니다.');
            }
        }
    };

    const handleNegative = () => {
        if (articleNo === 'writeNew') {
            const conf = window.confirm('글 작성을 취소하시겠습니까?');
            if (!conf) {
                return;
            }
            console.log('새 글 작성을 취소합니다.');
            // window.location.replace(redirectAfter);
            history.replace(redirectAfter);
        } else {
            if (editMode) {
                const conf = window.confirm('수정을 취소하시겠습니까?');
                if (!conf) {
                    return;
                }
                setTitle(titleBefore);
                setContents(contentsBefore);
                setFiles(filesBefore);
                setEditMode(false);
                console.log('현재 글 수정을 취소합니다.');
            } else {
                console.log('현재 글을 삭제합니다..');
                if (articleWriter === originalWriter) {
                    const conf = window.confirm('정말로 이 글을 삭제하시겠습니까?');
                    if (conf) {
                        database
                            .ref(articleRef + articleNo)
                            .set(null)
                            .then((snapshot) => {
                                alert('글이 삭제되었습니다.');
                                history.replace(redirectAfter);
                            })
                            .catch((err) => {
                                alert('삭제 중 에러가 발생했습니다.\n' + err);
                                console.error(err);
                            });

                        // console.log('모든 이미지 파일들을 삭제합니다.');
                        // const delImageFilePromises = [];
                        // storage
                        //     .ref()
                        //     .child(`attachments/${articleNo}`)
                        //     .listAll()
                        //     .then(async ({ items }) => {
                        //         items.forEach((file) => {
                        //             const deleteTask = file.delete();
                        //             delImageFilePromises.push(deleteTask);
                        //         });
                        //         Promise.all(delPromises)
                        //             .then(() => {
                        //                 console.log('모든 이미지 파일 삭제 됨');
                        //             })
                        //             .catch((err) => {
                        //                 alert('이미지 파일 삭제에 실패했습니다.');
                        //                 console.log(err.code);
                        //             });
                        //     });

                        console.log('모든 첨부 파일들을 삭제합니다.');
                        const delPromises = [];
                        storage
                            .ref()
                            .child(`attachments/${articleNo}`)
                            .listAll()
                            .then(async ({ items }) => {
                                items.forEach((file) => {
                                    const deleteTask = file.delete();
                                    delPromises.push(deleteTask);
                                });
                                Promise.all(delPromises)
                                    .then(() => {
                                        console.log('모든 첨부 파일 삭제 됨');
                                    })
                                    .catch((err) => {
                                        alert('첨부 파일 삭제에 실패했습니다.');
                                        console.log(err.code);
                                    });
                            });
                    }
                } else {
                    alert('글 작성자만 삭제가 가능합니다.');
                }
            }
        }
    };

    useEffect(() => {
        // 에디트모드 체크해서 거짓이면 글 번호로 조회해서 초기 세팅
        if (!editMode && articleNo !== 'writeNew' && articleNo !== '') {
            database
                .ref(articleRef + articleNo)
                .once('value')
                .then((snapshot) => {
                    const datas = snapshot.val();
                    if (!datas) {
                        alert('존재하지 않는 글입니다.');
                        history.replace(redirectAfter);
                        return;
                    }
                    const oTitle = datas.title;
                    const oContents = datas.contents;
                    const oAttachFiles = datas.attachFiles;
                    const oWriter = datas.writer;
                    // console.log(oContents);
                    setTitleBefore(oTitle);
                    setTitle(oTitle);
                    setContents(oContents);
                    setContentsBefore(oContents);
                    const fs = JSON.parse(oAttachFiles);
                    // console.log(fs);
                    setFiles(fs);
                    setFilesBefore(fs);
                    setOriginalWriter(oWriter);
                })
                .catch((err) => {
                    alert('글을 불러오는 중 에러가 발생했습니다.\n', err);
                    console.error(err);
                });
        }
    }, []);

    return (
        <>
            {window.location.pathname === redirectAfter ? (
                children
            ) : (
                <div className={classes.root}>
                    <div className={classes.titleContainer}>
                        {editMode ? (
                            <EdTitle
                                disabled={!editMode}
                                fullWidth
                                placeholder="제목"
                                size="medium"
                                variant="outlined"
                                onChange={onTitleChange}
                                value={title}
                                ref={titleElem}
                            />
                        ) : (
                            <div style={{ fontSize: 18, padding: '0 14px' }}>
                                <p>{title}</p>
                            </div>
                        )}
                    </div>
                    <div className={classes.editorContainer}>
                        <ReactQuill
                            style={{ display: editMode ? 'block' : 'none' }}
                            readOnly={!editMode}
                            bounds={quillBounds}
                            formats={quillFormats}
                            modules={quillModules}
                            value={contents}
                            //onChange={onEditorChange}
                            ref={quillElem}
                        />
                        <div
                            className="quill ql-container ql-editor board"
                            style={{ display: !editMode ? 'block' : 'none', minHeight: 560 }}
                        >
                            {ReactHtmlParser(contents)}
                        </div>
                    </div>
                    <div className={classes.attachFilesContainer}>
                        <Grid container spacing={1}>
                            <Grid item xs={editMode ? 8 : 12} sm={editMode ? 9 : 12} md={editMode ? 10 : 12} lg={editMode ? 11 : 12}>
                                {/* <EdAttachFilesTextField
                            fullWidth
                            // placeholder="첨부 파일"
                            size="small"
                            disabled
                            variant="outlined"
                            value={filesName}
                            onClick={onAttachFileClick}
                        /> */}
                                <div
                                    style={{
                                        backgroundColor: '#dedede',
                                        width: '100%',
                                        height: editMode ? '28px' : 'initial',
                                        borderRadius: editMode ? '0 4px 4px 4px' : '0 0 4px 4px',
                                        padding: '4px 0',
                                        overflow: 'auto',
                                        display: editMode ? 'block' : 'grid',
                                    }}
                                >
                                    {files.length > 0 ? (
                                        files.map((file, idx) => (
                                            <Link href={!file.link ? '#' : file.link} key={idx} variant="body2" style={{ margin: 4 }}>
                                                {file.name}
                                            </Link>
                                        ))
                                    ) : (
                                        <span style={{ color: '#999999', fontSize: 14, padding: '4px 8px' }}>
                                            {editMode ? '첨부 파일 선택' : '첨부 파일 없음'}
                                        </span>
                                    )}
                                </div>

                                <input hidden type="file" multiple onChange={onAttachFilesChange} ref={hiddenInput} />
                            </Grid>
                            {editMode ? (
                                <Grid item xs={4} sm={3} md={2} lg={1}>
                                    <Button fullWidth variant="outlined" onClick={onAttachFileClick}>
                                        파일 선택
                                    </Button>
                                </Grid>
                            ) : (
                                false
                            )}
                        </Grid>
                    </div>
                    <div className={classes.actionButtonsContainer}>
                        <Grid container spacing={1}>
                            <Grid item xs={12} sm={2}>
                                <Button fullWidth variant="outlined" onClick={handlePositive}>
                                    {editMode ? '완료' : '수정'}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Button fullWidth variant="text" onClick={handleNegative}>
                                    {editMode ? '취소' : '삭제'}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                {!editMode ? (
                                    <div className={classes.gotoListContainer}>
                                        <Link href={redirectAfter}>
                                            <Button startIcon={''}>목록으로</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    false
                                )}
                            </Grid>
                        </Grid>
                    </div>
                </div>
            )}
        </>
    );
}

Freeboard.defaultProps = {
    quillBounds: '.app',
    quillFormats: [
        'header',
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'indent',
        'link',
        'image',
        'video',
        'script',
        'width',
    ],
    quillModules: {
        toolbar: [
            [{ header: '1' }, { header: '2' }, { font: [] }],
            [{ size: [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['link', 'image', 'video'],
            ['clean'],
        ],
        clipboard: {
            // toggle to add extra line breaks when pasting HTML:
            matchVisual: false,
        },
        imageResize: { parchment: Quill.import('parchment') },
        //imageDrop: true,
        imageUpload: {
            url: '', // server url. If the url is empty then the base64 returns
            method: 'POST', // change query method, default 'POST'
            name: 'image', // custom form name
            withCredentials: false, // withCredentials
            headers: {}, // add custom headers, example { token: 'your-token'}
            csrf: {
                token: 'token',
                hash: '',
            }, // add custom CSRF
            customUploader: (file, returnTo) => {}, // add custom uploader
            // personalize successful callback and call next function to insert new url to the editor
            callbackOK: (serverResponse, next) => {},
            // personalize failed callback
            callbackKO: (serverError) => {
                alert(serverError);
            },
            // optional
            // add callback when a image have been chosen
            checkBeforeSend: (file, next) => {
                // console.log(file);
                next(file); // go back to component and send to the server
            },
        },
    },
    articleRef: '/',
    articleNo: window.location.pathname,
    articleWriter: '익명',
    redirectAfter: '/',
};

export default React.memo(Freeboard);
