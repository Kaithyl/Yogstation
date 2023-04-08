import { Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useSharedState } from '../backend';
import { Window } from '../layouts';

class Stamp extends Component {
  constructor(props) {
    super(props);
    this.icon = props.icon;
    // Necessary in ES6
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const [active, setActive] = useSharedState(this.context, this.icon+"_active", false);
    if (active) { return; }
    const { act } = useBackend(this.context);
    setActive(true);
    act('stamp_down');
    setTimeout(() => {
      setActive(false);
      act('stamp_up');
    }, 500);
  }

  render() {
    const { data } = useBackend(this.context);
    const { tray_cover, stamp_approve } = data;
    const [active] = useSharedState(this.context, this.icon+"_active", false);
    const styles = {
      tray : {
        "margin-left": "-1.25vw",
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
      },
      tray_cover : {
        width:"7.82vw",
        "pointer-events": "none",
      },
      stamp : {
        "margin-left": "-6.8vw",
        width: "5.9vw",
        "z-index": -1,
        transition: "transform 150ms ease-out 0s",
      },
      up: { transform: "translateY(0vh)" },
      down: { transform: "translateY(5vh)" },
    };
    return (
      <span>
        <img src={resolveAsset(tray_cover)}
            style={{ ...styles.tray, ...styles.tray_cover }} />
        <img src={resolveAsset(this.icon)} onClick={this.handleClick}
            style={{ ...styles.tray, ...styles.stamp, ...active ? styles.down : styles.up }} />
      </span>
    );
  }
}

class StampTray extends Component {
  constructor(props) {
    super(props);
    // Necessary in ES6
    this.handleToggle = this.handleToggle.bind(this);
  }

  handleToggle() {
    const [active, setActive] = useSharedState(this.context, "tray_active", false);
    const { act } = useBackend(this.context);
    setActive(prev => !prev);
    act(active ? 'tray_open' : 'tray_close');
  }

  createSegs(num) {
    const { data } = useBackend(this.context);
    const { tray_seg } = data;
    const style = {
      position: "relative",
      "-ms-interpolation-mode": "nearest-neighbor",
      width: "5vw",
      "z-index": -1,
    };
    let segs = [];
    for (let i = 0; i < num; i++) {
      segs.push(<img src={resolveAsset(tray_seg)} style={style} />);
    }
    return segs;
  }

  render() {
    const { data } = useBackend(this.context);
    const { tray_end, stamp_approve, stamp_deny } = data;
    const [active] = useSharedState(this.context, "tray_active", false);
    const styles = {
      slide : {
        position: "absolute",
        "padding-top": "10vh",
        "box-shadow": "0vw 7vh 0 0 rgba(0, 0, 0, .2)",
        transition: "transform 300ms ease-in-out 0s",
      },
      in : { transform: "translateX(0vw)" },
      out : { transform: "translateX(-25.7vw)" },
      tray_end : {
        width:"4.3vw",
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
      },
    };
    return (
      <div style={{ ...styles.slide, ...active ? styles.in : styles.out }}>
        { this.createSegs(1) }
        <Stamp icon={stamp_deny} />
        { this.createSegs(1) }
        <Stamp icon={stamp_approve} />
        { this.createSegs(1) }
        <img src={resolveAsset(tray_end)}
          style={styles.tray_end} onClick={this.handleToggle} />
      </div>
    );
  }
}

export const InspectorBooth = (props, context) => {
  const { act, data } = useBackend(context);
  const { bg_desk } = data;
  return (
    <Window width={775} height={500}>
      <div style={`-ms-interpolation-mode: nearest-neighbor;
        background-image: url(${resolveAsset(bg_desk)}); background-repeat: space;
        background-size: 10px 10px; height: 100vh;`}>
        <StampTray />
      </div>
    </Window>
  );
};
