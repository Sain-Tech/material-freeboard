import React, { useState, useEffect, useRef } from 'react';

import { Button, Grid, TextField } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/styles';

import ReactQuill, { Quill } from 'react-quill';

import ImageResize from 'quill-image-resize-module-react';
import { ImageDrop } from 'quill-image-drop-module';
import { ImageUpload } from 'quill-image-upload';

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

function Freeboard({ firebase, editMode, quillBounds, quillFormats, quillModules, children }) {
    const classes = useStyles();

    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [files, setFiles] = useState([]);
    const [filesName, setFilesName] = useState('첨부 파일');

    const hiddenInput = useRef();

    const onTitleChange = (e) => {
        console.log(e.target.value);
        setTitle(e.target.value);
    };

    const onEditorChange = (html) => {
        console.log(html);
        setContents(html);
    };

    const onAttachFileClick = (e) => {
        e.preventDefault();
        hiddenInput.current.click();
    };

    const onAttachFilesChange = ({ currentTarget }) => {
        //console.log(fs.currentTarget.files);
        const originals = currentTarget.files;
        const filesArr = [];
        let fNames = '';
        Object.keys(originals).forEach((fkey) => {
            filesArr.push(originals[fkey]);
            fNames += `${originals[fkey].name}  `;
        });
        console.log(filesArr);
        setFiles(filesArr);
        setFilesName(fNames);
    };

    const handleSubmit = () => {};

    const handleCancel = () => {};

    useEffect(() => {}, []);

    return (
        <div className={classes.root}>
            <div className={classes.titleContainer}>
                <EdTitle fullWidth placeholder="제목" size="medium" variant="outlined" onChange={onTitleChange} />
            </div>
            <div className={classes.editorContainer}>
                <ReactQuill bounds={quillBounds} formats={quillFormats} modules={quillModules} value={contents} onChange={onEditorChange} />
            </div>
            <div className={classes.attachFilesContainer}>
                <Grid container spacing={1}>
                    <Grid item xs={8} sm={9}>
                        <EdAttachFilesTextField
                            fullWidth
                            // placeholder="첨부 파일"
                            size="small"
                            disabled
                            variant="outlined"
                            value={filesName}
                            onClick={onAttachFileClick}
                        />
                        <input hidden type="file" multiple onChange={onAttachFilesChange} ref={hiddenInput} />
                    </Grid>
                    <Grid item xs={4} sm={3}>
                        <Button fullWidth onClick={onAttachFileClick}>
                            파일 선택
                        </Button>
                    </Grid>
                </Grid>
            </div>
            <div className={classes.actionButtonsContainer}>
                <Grid container spacing={1}>
                    <Grid item xs={12} sm={2}>
                        <Button fullWidth variant="outlined" onClick={handleSubmit}>
                            완료
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button fullWidth variant="text" onClick={handleCancel}>
                            취소
                        </Button>
                    </Grid>
                </Grid>
            </div>
        </div>
    );
}

Freeboard.defaultProps = {
    editMode: true,
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
        imageDrop: true,
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
};

export default React.memo(Freeboard);
