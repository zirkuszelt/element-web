import React from 'react';
export default class Welcome extends React.PureComponent {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        // redirect immediately to login page
        setTimeout( () => {
            window.location.hash = '#/login'
        }, 100)
    }

    render() {
        return (
            <div> </div>
        );
    }
}
