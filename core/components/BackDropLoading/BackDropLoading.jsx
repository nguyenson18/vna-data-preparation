"use client";
import React from 'react';

// import { history } from '../_helpers';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { LoadingService } from '../services';


class Loader extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false
        };
    }

    componentDidMount() {
        this.subscription = LoadingService.onLoader()
            .subscribe((val) => {
                this.setState({ open: val});
            });
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    stopLoading() {
        this.setState({ open: false })
    }

    render() {
        return (
            <div>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 111 }}
                    open={this.state.open}
                    >
                    <CircularProgress color="inherit" />
                </Backdrop>
            </div>
        );
    }
}


export { Loader };