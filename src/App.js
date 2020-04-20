import React, { useEffect } from 'react';
import './styles/fonts.scss';
import { Route, useHistory } from 'react-router-dom';
import Notice from './pages/Notice';

// firebase.initializeApp(apiConfig);

function App() {
    const history = useHistory();
    useEffect(() => {
        if (history.location.pathname === '/') history.push('/notice');
    }, []);
    return (
        <div>
            <Route path="/notice" component={Notice} />
        </div>
    );
}

export default App;
