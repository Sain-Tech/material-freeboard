import React from 'react';
import './styles/fonts.scss';
import Freeboard from './components/Freeboard';
//import QuillEditor from './components/QuillEditor';
// import * as firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/firestore';
// import 'firebase/database';
// import 'firebase/analytics';
// import 'firebase/storage';
// import { id, pw, apiConfig } from './db/FirebaseAdminConfig';

import { Route } from 'react-router-dom';
import Notice from './pages/Notice';
import { Link } from '@material-ui/core';

// firebase.initializeApp(apiConfig);

function App() {
    return (
        <div>
            <Route path="/notice" component={Notice} />
            {/* <Freeboard firebase={firebase} >
                
            </Freeboard> */}
        </div>
    );
}

export default App;
