import React, {Component} from "react";

import Countdown, {CountdownApi} from "react-countdown";

export default class CountdownComponent extends Component {
    countdownApi: CountdownApi | null = null;
    state = {date: Date.now() + 5 * 60000}

    handleStartClick = (): void => {
        this.countdownApi && this.countdownApi.start()
    }

    handleStopClick = (): void => {
        this.countdownApi && this.countdownApi.stop()
    }

    handleUpdate = (): void => {
        this.forceUpdate()
    }

    setRef = (countdown: Countdown | null): void => {
        if (countdown) {
            this.countdownApi = countdown.getApi();
        }
    };

    render() {
        return (
            <>
                <Countdown
                    key={this.state.date}
                    ref={this.setRef}
                    date={this.state.date}
                    onMount={this.handleUpdate}
                    onStart={this.handleUpdate}
                    onStop={this.handleUpdate}
                    autoStart={false}
                    />
            </>
        )
    }
}