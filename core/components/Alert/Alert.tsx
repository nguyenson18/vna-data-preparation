"use client";
import React from 'react';
import MuiAlert, { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { NotifyService } from '../services';


interface AlertType {
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  autoClose?: boolean;
  keepAfterRouteChange?: boolean;
  fade?: boolean;
  vertical?: 'top' | 'bottom';
  horizontal?: 'left' | 'center' | 'right';
}

const AlertM = React.forwardRef<HTMLDivElement, MuiAlertProps>(function AlertM(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface AlertProps {
  id?: string;
  fade?: boolean;
}

interface AlertState {
  alerts: AlertType[] 
}

class Alert extends React.Component<AlertProps, AlertState> {
  static defaultProps: Partial<AlertProps> = {
    id: 'default-alert',
    fade: true,
  };

  subscription: any;

  constructor(props: AlertProps) {
    super(props);
    this.state = {
      alerts: [] ,
    };
  }

  componentDidMount() {
    this.subscription = NotifyService.onAlert(this.props.id || "").subscribe(alert => {
      if (!alert.message) {
        const alerts = this.state.alerts.filter(x => x.keepAfterRouteChange);
        alerts.forEach(x => delete x.keepAfterRouteChange);
        this.setState({ alerts });
        return;
      }

      this.setState({ alerts: [...this.state.alerts, alert] });

      if (alert.autoClose) {
        setTimeout(() => this.removeAlert(alert), 3000);
      }
    });
  }

  componentWillUnmount() {
    this.subscription?.unsubscribe?.();
  }

  removeAlert(alert: any) {
    if (this.props.fade) {
      const alertWithFade = { ...alert, fade: true };
      this.setState({ alerts: this.state.alerts.map(x => (x === alert ? alertWithFade : x)) });

      setTimeout(() => {
        this.setState({ alerts: this.state.alerts.filter(x => x !== alertWithFade) });
      }, 250);
    } else {
      this.setState({ alerts: this.state.alerts.filter(x => x !== alert) });
    }
  }

  render() {
    const { alerts } = this.state;
    if (!alerts.length) return null;

    return (
      <div>
        {alerts.map((alert, index) => (
          <div key={index}>
            <Snackbar
              anchorOrigin={{ vertical: alert?.vertical || 'top', horizontal: alert?.horizontal || 'right' }}
              open={true}
              autoHideDuration={3000}
              onClose={() => this.removeAlert(alert)}
            >
              <AlertM onClose={() => this.removeAlert(alert)} severity={alert.type} sx={{ width: '100%' }}>
                {alert.message}
              </AlertM>
            </Snackbar>
          </div>
        ))}
      </div>
    );
  }
}

export { Alert };
