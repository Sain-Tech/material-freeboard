import React from 'react';
import { Redirect } from 'react-router-dom';

function BoardListViewer({ datas, children }) {
    return (
        <>
            {datas.map((data) => (
                <div key={data.no}>
                    <a href={window.location.pathname + '/' + data.no}>{data.title}</a>
                </div>
            ))}
        </>
    );
}

BoardListViewer.defaultProps = {
    newest: false,
};

export default React.memo(BoardListViewer);
