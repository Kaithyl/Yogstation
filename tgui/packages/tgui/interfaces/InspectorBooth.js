import { Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useSharedState } from '../backend';
import { Window } from '../layouts';

import { Draggable } from '../components/Draggable';

class Stamp extends Component {
  constructor(props) {
    super(props);
    this.icon = props.icon;
    // Necessary in ES6
    this.handleClick = this.handleClick.bind(this);
  }

  // Fixes stuck buttons when client closes before timeout
  componentDidMount() {
    const [active, setActive] = useSharedState(this.context, this.icon+"_active", false);
    const [timer] = useSharedState(this.context, this.icon+"_timer", false);
    const { act } = useBackend(this.context);
    if (active && new Date().getTime() - timer > 500) {
      setActive(false);
      act('stamp_up');
    }
  }

  handleClick() {
    const [active, setActive] = useSharedState(this.context, this.icon+"_active", false);
    const [timer, setTimer] = useSharedState(this.context, this.icon+"_timer", new Date().getTime());
    if (active) { return; }
    const { act } = useBackend(this.context);
    setActive(true);
    act('stamp_down');
    setTimeout(() => {
      setActive(false);
      act('stamp_up');
    }, 500);
    setTimer(new Date().getTime());
  }

  render() {
    const [active] = useSharedState(this.context, this.icon+"_active", false);
    const styles = {
      tray : {
        "margin-left": "-1.23vw",
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
      },
      tray_cover : {
        width:"9.487vw",
        "pointer-events": "none",
      },
      stamp : {
        "margin-left": "-8.27vw",
        width: "6.9vw",
        "z-index": -1,
        transition: "transform 150ms ease-out 0s",
        "pointer-events": "auto",
      },
      up: { transform: "translateY(0vh)" },
      down: { transform: "translateY(5vh)" },
    };
    return (
      <span>
        <img src={resolveAsset("tray_cover.png")}
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
    const style = {
      position: "relative",
      "-ms-interpolation-mode": "nearest-neighbor",
      width: "6vw",
      "z-index": -1,
    };
    let segs = [];
    for (let i = 0; i < num; i++) {
      segs.push(<img src={resolveAsset("tray_segment.png")} style={style} />);
    }
    return segs;
  }

  render() {
    const [active] = useSharedState(this.context, "tray_active", false);
    const styles = {
      slide : {
        position: "absolute",
        "margin-top": "10vh",
        "margin-bottom": "0.5vh",
        display: "contents",
        transition: "transform 300ms ease-in-out 0s",
        "pointer-events": "none",
      },
      in : { transform: "translateX(0vw)" },
      out : { transform: "translateX(-31.5vw)" },
      tray_end : {
        width:"5.14vw",
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
        "pointer-events": "auto",
      },
      // because applying it to the previous div leaves a gap due to borders
      shadow : {
        "margin-top": "-8.5vh",
        padding: "7%",
        "box-shadow": "0vw 7vh 0 0 rgba(0, 0, 0, .2)",
      },
    };
    return (
      <div style={{ ...styles.slide, ...active ? styles.in : styles.out }}>
        { this.createSegs(1) }
        <Stamp icon={resolveAsset("stamp_deny.png")} />
        { this.createSegs(1) }
        <Stamp icon={resolveAsset("stamp_approve.png")} />
        { this.createSegs(1) }
        <img src={resolveAsset("tray_end.png")}
          style={styles.tray_end} onClick={this.handleToggle} />
        <div style={styles.shadow} />
      </div>
    );
  }
}

class Paperwork extends Component {
  constructor(props) {
    super(props);
    this.text = props.text;
  }

  sanitizeHTML(input) {
    const regex = /(<([^>]+)>)/gi;
    return input.replace(regex, " ");
  }

  render() {
    const style = {
      width: "30vw",
      height: "60vh",
      "box-sizing": "border-box",
      padding: "10%",
      color: "black",
      background: "rgba(252, 236, 214, 1)",
    };
    return (
      <Draggable>
        <div style={style}>
          { this.sanitizeHTML(this.text) }
        </div>
      </Draggable>
    );
  }
}

export const InspectorBooth = (props, context) => {
  const { data } = useBackend(context);
  return (
    <Window width={775} height={500} >
      <div style={`-ms-interpolation-mode: nearest-neighbor;
        background-image: url(${resolveAsset("desk.png")}); background-repeat: space;
        background-size: 10px 10px; height: 100vh; -ms-user-select: none; user-select: none;`}>
        {data.items.map(key => (
          <Paperwork key={key.toString()} text={key} />
        ))}
        <StampTray />
      </div>
    </Window>
  );
};
