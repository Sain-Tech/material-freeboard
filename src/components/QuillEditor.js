import React, { useState, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import { ImageUpload } from 'quill-image-upload';
import ImageResize from 'quill-image-resize-module-react';
import { ImageDrop } from 'quill-image-drop-module';
import { fbdb, storage } from '../db/DBCtrl';
import 'react-quill/dist/quill.snow.css';
Quill.register('modules/imageUpload', ImageUpload);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/imageDrop', ImageDrop);

function QuillEditor() {
    const [contents, setContents] = useState('');
    const handleChange = (html) => {
        console.log(html);
        setContents(html);
    };

    const handleSubmit = () => {
        const datetime = new Date();
        const timeserial = datetime.getTime();
        const year = datetime.getFullYear();
        const month = datetime.getMonth() + 1;
        const date = datetime.getDate();
        const hours = datetime.getHours();
        const minutes = datetime.getMinutes();
        const seconds = datetime.getSeconds();
        const datestr = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
        fbdb.ref(`/Boards/${timeserial}`).set(
            {
                writeDate: datestr,
                title: 'untitled',
                contents: contents,
            },
            (err) => {
                if (err) {
                    console.error('send error');
                } else {
                    alert('성공!');
                }
            },
        );
    };

    useEffect(() => {
        // get contents;
        fbdb.ref('/Boards/1586629799079')
            .once('value')
            .then((snapshot) => {
                console.log(snapshot.val());
                //setContents(snapshot.val()['contents']);
            });
    }, []);

    return (
        <>
            <ReactQuill
                //theme={this.state.theme}
                onChange={handleChange}
                value={contents}
                modules={QuillEditor.modules}
                formats={QuillEditor.formats}
                bounds={'.app'}
                //placeholder={this.props.placeholder}
            />
            {/* <div className="themeSwitcher">
                <label>Theme </label>
                <select onChange={(e) => this.handleThemeChange(e.target.value)}>
                    <option value="snow">Snow</option>
                    <option value="bubble">Bubble</option>
                    <option value="core">Core</option>
                </select>
            </div> */}
            <button onClick={handleSubmit}>submit</button>
        </>
    );
}

QuillEditor.modules = {
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
        customUploader: (file, returnTo) => {
            storage
                .ref(`/${file.name}`)
                .put(file)
                .then((snapshot) => {
                    //console.log(snapshot);
                    storage
                        .ref(`/${file.name}`)
                        .getDownloadURL()
                        .then((url) => {
                            returnTo(url);
                        });
                });
            //return 'testimg';
            //QuillEditor.modules.imageUpload.callbackOK('test', 'next');
        }, // add custom uploader
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
};
/*
 * Quill editor formats
 * See https://quilljs.com/docs/formats/
 */
QuillEditor.formats = [
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
];

export default QuillEditor;
