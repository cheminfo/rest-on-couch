import React from 'react';

export default function Allowed(props) {
    if (props.allowed) {
        return (
            <div>
                {props.children}
            </div>
        );
    } else {
        return (
            <div>
                You are not allowed to access this page
            </div>
        );
    }
}
