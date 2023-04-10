// Paper.dm already directly allows writable HTML elements, which
// this directly pulls from, so this should be as safe from code injection
// as much as a mechanic thats already been in the game for a decade
/* eslint-disable react/no-danger */
import { Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useLocalState, useSharedState } from '../backend';
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
    const { act, config } = useBackend(this.context);
    if (active && new Date().getTime() - timer > 500) {
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }
  }

  handleClick() {
    const [active, setActive] = useSharedState(this.context, this.icon+"_active", false);
    const [timer, setTimer] = useSharedState(this.context, this.icon+"_timer", new Date().getTime());
    if (active) { return; }
    const { act, config } = useBackend(this.context);
    setActive(true);
    act('play_sfx', { name: 'stamp_down', ckey: config.client?.ckey });
    setTimeout(() => {
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }, 500);
    setTimer(new Date().getTime());
  }

  render() {
    const [active] = useSharedState(this.context, this.icon+"_active", false);
    const styles = {
      tray : {
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
        "margin-left": "-1.23vw",
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
    const { act, config } = useBackend(this.context);
    setActive(prev => !prev);
    act('play_sfx', { name: active ? 'tray_open' : 'tray_close', ckey: config.client?.ckey });
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
    const [zIndex] = useLocalState(this.context, "zindex", 0);
    const styles = {
      slide : {
        position: "absolute",
        "top": "10vh",
        "z-index": zIndex+100,
        // "margin-bottom": "0.5vh",
        display: "contents",
        transition: "transform 300ms ease-in-out 0s",
        "pointer-events": "none",
        "box-shadow": "0vw 7vh 0 0 rgba(0, 0, 0, .2)",
      },
      in : { transform: "translateX(0vw)" },
      out : { transform: "translateX(-31.5vw)" },
      tray_end : {
        width:"5.14vw",
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
        "pointer-events": "auto",
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
      </div>
    );
  }
}

class Paperwork extends Component {
  constructor(props) {
    super(props);
    this.debug = this.props.debug;
    this.id = props.id;
    this.text = props.text;
    this.x = props.x;
    this.y = props.y;

    // Necessary in ES6
    this.handleOnDrag = this.handleOnDrag.bind(this);
    this.onStopDrag = this.onStopDrag.bind(this);
  }

  // Remove all font tags
  sanitizeHTML(input) {
    const regex = /<\/?font[^>]*>/gi;
    return input.replace(regex, " ");
  }

  // Technically zindex could hit the integer limit but theoretically,
  // a round should never last long enough for it to matter
  // If anyone wanted to make zindexing shared between clients, change
  // zindex to useSharedState and have item_list store z-values
  handleOnDrag(e) {
    const { act, config } = useBackend(this.context);
    const [zIndex, setZIndex] = useLocalState(this.context, "zindex", 0);
    setZIndex(prev => prev+1);
    e.z = zIndex;
    act('play_sfx', { name: 'drag_start', ckey: config.client?.ckey });
  }

  onStopDrag(e) {
    const { dX, dY } = e.state;
    const { act, config } = useBackend(this.context);
    act('move_item', { id: this.id, x: dX, y: dY });
    act('play_sfx', { name: 'drag_stop', ckey: config.client?.ckey });
  }

  render() {
    const styles = {
      text: {
        position: "absolute",
        top: "0",
        "box-sizing": "border-box",
        padding: "10%",
        "text-align": "left",
        color: "black",
        "font-size": "2vmin",
        "line-height": "2vmin",
      },
      // Have to use an img because nearest-neighbor/pixelated doesn't affect background-image
      box: {
        "-ms-interpolation-mode": "nearest-neighbor",
        "width": "30vw",
        "height": "60vh",
        "border-left": "dashed 1px rgba(0, 0, 0, .2)",
        "border-bottom": "dashed 1px rgba(0, 0, 0, .2)",
      },
      drag: {
        "box-shadow": "-1vw 3vh 0 0 rgba(0, 0, 0, .2)",
      },
    };
    return (
      <Draggable debug={this.debug} drag={styles.drag} onDrag={this.handleOnDrag}
        stopDrag={this.onStopDrag} x={this.x} y={this.y}>
        <div style={styles.box}>
          <img src={resolveAsset("paper.png")} style={styles.box} />
            {this.debug && (<div style={styles.text}> {this.sanitizeHTML(this.text)} </div>)}
            {!this.debug && (<div style={styles.text} dangerouslySetInnerHTML={{ __html: this.sanitizeHTML(this.text) }} />)}
        </div>
      </Draggable>
    );
  }
}

export const InspectorBooth = (props, context) => {
  const { data } = useBackend(context);
  const { items=[] } = data;
  return (
    <Window width={775} height={500} >
      <div style={`-ms-interpolation-mode: nearest-neighbor;
        background-image: url(${resolveAsset("desk.png")}); background-repeat: space;
        background-size: 10px 10px; height: 100vh; -ms-user-select: none; user-select: none;`}>
        <StampTray />
        {items.map(item => (
          <Paperwork key={item.id} id={item.id} text={item.text} x={item.x} y={item.y} />
        ))}
      </div>
    </Window>
  );
};
