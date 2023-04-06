import { Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useSharedState } from '../backend';
import { Window } from '../layouts';

class StampTray extends Component {
  constructor(props) {
    super(props);
    // Necessary in ES6
    this.handleToggle = this.handleToggle.bind(this);
  }

  handleToggle() {
    const [active, setActive] = useSharedState(this.context, "active", false);
    const { act } = useBackend(this.context);
    setActive(prev => !prev);
    act(active ? 'tray_open' : 'tray_close');
  }

  render() {
    const [active, setActive] = useSharedState(this.context, "active", false);
    const styles = {
      in : {
        transform: "translateX(0%)",
        transition: "transform 300ms ease-in-out 0s",
      },
      out : {
        transform: "translateX(40%)",
        transition: "transform 300ms ease-in-out 0s",
      },
    };
    return (
      <div style={active ? styles.out : styles.in} onClick={this.handleToggle}>
        <img src={resolveAsset('tray.png')}
              position="absolute"
              style={`-ms-interpolation-mode: nearest-neighbor;
              width: 50%; margin-top:10%; margin-left: -45%;`} />
      </div>
    );
  }
}

export const InspectorBooth = (props, context) => {
  const { act, data } = useBackend(context);
  const { tray } = data;
  return (
    <Window>
      <Window.Content>
        <StampTray />
      </Window.Content>
    </Window>
  );
};
