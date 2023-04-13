/**
 * @file
 * @copyright 2023 Kaithyl (https://github.com/kaithyl)
 * @license MIT
 */

import { Fragment, Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useSharedState, useLocalState } from '../backend';
import { Window } from '../layouts';

import { Draggable } from '../components/Draggable';
import DOMPurify from 'dompurify';

// DO NOT REMOVE THIS IS IMPORTANT FOR PREVENTING INJECTION ATTACKS
const sanitizeHTML = (input) => {
  input = DOMPurify.sanitize(input, {
    FORBID_ATTR: ['class', 'style'],
    ALLOWED_TAGS: [
      'br', 'code', 'li', 'p', 'pre', 'span', 'table', 'td', 'tr',
      'th', 'ul', 'ol', 'menu', 'b', 'center', 'table', 'tr', 'th', 'hr',
    ],
  });
  input = input.replace(/\[%f\]/g, `<input type="checkbox" disabled="disabled" />`);
  return input;
};

const outOfBounds = (x, y) => {
  return x < 0 || x > 110 || y < 0 || y > 110;
};

const overlap = (first, second) => {
  const x = first?.getBoundingClientRect();
  const y = second?.getBoundingClientRect();
  if (x === undefined || y === undefined) { return false; }
  return !(x.left > y.right || x.right < y.left || x.top > y.bottom || x.bottom < y.top);
};

const inside = (first, second) => {
  const x = first?.getBoundingClientRect();
  const y = second?.getBoundingClientRect();
  if (x === undefined || y === undefined) { return false; }
  return !(x.left < y.left || x.left > y.right || x.top < y.top || x.top > y.bottom);
};

class Stamp extends Component {
  constructor(props) {
    super(props);
    this.icon = props.icon;
    this.type = props.type ?? this.icon.toString();
    // Necessary in ES6
    this.handleClick = this.handleClick.bind(this);
  }

  // Fixes stuck buttons when client closes before timeout
  componentDidMount() {
    const [active, setActive] = useSharedState(this.context, this.type+"_active", false);
    const [timer] = useSharedState(this.context, this.type+"_timer", false);
    const { act, config } = useBackend(this.context);
    if (active && new Date().getTime() - timer > 500) {
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }
  }

  stamp() {
    const { act } = useBackend(this.context);
    if (!this.ref) { return; }
    const papers = document.getElementsByClassName('InspectorBooth__Items__paper');
    if (papers.length <= 0) { return; }
    let paper = null;
    let z = -Infinity;
    for (let i = 0; i < papers.length; i++) {
      if (overlap(this.ref, papers[i]) && papers[i].dataset.z >= z) {
        paper = papers[i];
        z = papers[i].dataset.z;
      }
    }
    if (paper === null) { return; }
    act('stamp_item', { id: paper.dataset.id, type: this.type });
  }

  handleClick() {
    const [active, setActive] = useSharedState(this.context, this.type+"_active", false);
    const [, setTimer] = useSharedState(this.context, this.type+"_timer", new Date().getTime());
    if (active) { return; }
    const { act, config } = useBackend(this.context);
    setActive(true);
    act('play_sfx', { name: 'stamp_down', ckey: config.client?.ckey });
    setTimeout(() => {
      this.stamp();
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }, 500);
    setTimer(new Date().getTime());
  }

  render() {
    const [active] = useSharedState(this.context, this.type+"_active", false);
    const styles = {
      tray_cover : {
        "margin-left": "-1.23vw",
        width:"9.487vw",
      },
      stamp : {
        "margin-left": "-8.27vw",
        width: "6.9vw",
        transition: "transform 150ms ease-out 0s",
      },
      up: { transform: "translateY(0vh)" },
      down: { transform: "translateY(5vh)" },
    };
    return (
      <span>
        <img src={resolveAsset("tray_cover.png")} style={styles.tray_cover} />
        <img className={'InspectorBooth__Tray__stamp'} src={resolveAsset(this.icon)} onClick={this.handleClick}
            ref={ref => (this.ref = ref)} style={{ ...styles.stamp, ...active ? styles.down : styles.up }} />
        {this.debuglog && (<div style={`position: absolute; left: 0; top: 0;`}> {this.debuglog} </div>)}
      </span>
    );
  }
}

class StampTray extends Component {
  constructor(props) {
    super(props);
    this.end_width = 5.145;
    this.slide_width = -31.65;

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  initRef(ref) {
    this.ref = ref;
    if (this.ref) {
      this.slide_width = -((100*this.ref.getBoundingClientRect().width/window.innerWidth) - this.end_width - 0.2);
    }
  }

  handleToggle() {
    const [active, setActive] = useSharedState(this.context, "tray_active", false);
    const { act, config } = useBackend(this.context);
    this.init = true;
    setActive(prev => !prev);
    act('play_sfx', { name: active ? 'tray_open' : 'tray_close', ckey: config.client?.ckey });
  }

  createSegs(num) {
    let segs = [];
    for (let i = 0; i < num; i++) {
      segs.push(<img className={'InspectorBooth__Tray__segment'}
        src={resolveAsset("tray_segment.png")} style={`width: 6vw;`} />);
    }
    return segs;
  }

  render() {
    const { data } = useBackend(this.context);
    const { stamps=[] } = data;
    const [active] = useSharedState(this.context, "tray_active", false);
    const [zIndex] = useSharedState(this.context, "zindex", 0);
    const styles = {
      slide : {
        "z-index": zIndex*2,
        transition: this.init ? "transform 300ms ease-in-out 0s" : "none",
      },
      out : { transform: "translateX(0vw)" },
      in : { transform: `translateX(${this.slide_width}vw)` },
      tray_end : {
        width: `${this.end_width}vw`,
        position: "relative",
        "pointer-events": "auto",
      },
    };
    const className = `InspectorBooth__Tray`;
    return (
      <div ref={this.initRef} className={className} style={{ ...styles.slide, ...active ? styles.out : styles.in }}>
        {stamps.map(stamp => (
          <span key={stamp.type}>
            { this.createSegs(1) }
            <Stamp type={stamp.type} icon={resolveAsset(stamp.icon)} />
          </span>
        ))}
        { this.createSegs(1) }
        <img src={resolveAsset("tray_end.png")} style={styles.tray_end} onClick={this.handleToggle} />
      </div>
    );
  }
}

class Item extends Draggable {
  constructor(props) {
    super(props);
    this.state = { ...this.state, ...{ isSmall: false, trueZ: props.z } };
    this.removable = props.removable;
    this.className = props.className;
    this.debug = props.debug;
    this.item_id = props.item_id;

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.duringDrag = this.duringDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
  }

  initRef(ref) {
    this.ref = ref;
    let shrink = document.getElementsByClassName('InspectorBooth__Receptacle--shrink')[0];
    let small = inside(this.ref, shrink);
    // on initial spawn
    const { act } = useBackend(this.context);
    const [zIndex, setZIndex] = useSharedState(this.context, "zindex", 0);
    const { trueZ } = this.state;
    if (outOfBounds(this.props.x, this.props.y)) {
      setZIndex(prev => prev+1);
      this.setState({ trueZ: zIndex });
      act('move_item', { id: this.item_id, x: 80, y: 50, z: trueZ });
    }
    this.setState({ isSmall: small, z: trueZ + (small ? 2000 : 0) });
  }

  startDrag(e) {
    super.startDrag(e);
    const { act, config } = useBackend(this.context);
    const [zIndex, setZIndex] = useSharedState(this.context, "zindex", 0);
    const [, setIsDragging] = useLocalState(this.context, "isDragging", false);
    const { isSmall, trueZ } = this.state;
    if (this.props.dragVisible) {
      setIsDragging(true);
    }
    setZIndex(prev => prev+1);
    this.setState({ trueZ: zIndex, z: zIndex + (isSmall ? 2000 : 0) });
    if (this.sfx_startDrag) {
      act('play_sfx', { name: this.sfx_startDrag, ckey: this.useUser ? config.client?.ckey : null });
    }
  }

  duringDrag(e) {
    super.duringDrag(e);
    const bins = document.getElementsByClassName('InspectorBooth__Receptacle--shrink');
    let shrink = false;
    for (let i = 0; i < bins.length; i++) {
      if (inside(this.ref, bins[i])) {
        shrink = true;
        break;
      }
    }
    const { trueZ } = this.state;
    this.setState({
      isSmall: shrink,
      center: shrink,
      z: trueZ + (shrink ? 2000 : 0),
    });
  }

  stopDrag(e) {
    super.stopDrag(e);
    const { act, config } = useBackend(this.context);
    const [, setIsDragging] = useLocalState(this.context, "isDragging", false);
    const { isSmall, dX, dY, trueZ } = this.state;
    if (this.props.dragVisible) {
      setIsDragging(false);
    }
    if (isSmall) { this.setState({ z: trueZ+2000 }); }
    act('move_item', { id: this.item_id, x: dX, y: dY, z: trueZ });
    if (this.sfx_stopDrag) {
      act('play_sfx', { name: this.sfx_stopDrag, ckey: this.useUser ? config.client?.ckey : null });
    }
    processItem(this.context, this, this.item_id);
  }

  renderChildren() {
    const { isSmall, dX, dY, z } = this.state;
    const small = isSmall ? '--small' : '';
    const oob = outOfBounds(this.props.x, this.props.y);
    return (
      <div data-id={this.item_id} data-z={z} className={this.className+small} ref={this.initRef}>
          {!oob && (this.renderItem && (this.renderItem())) }
      </div>
    );
  }
}

class Paperwork extends Item {
  constructor(props) {
    super(props);
    this.className = 'InspectorBooth__Items__paper';
    this.dragStyle = { "box-shadow": "-1vw 3vh 0 0 rgba(0, 0, 0, .2)" };
    this.useUser = true;
    this.sfx_startDrag = 'drag_start';
    this.sfx_stopDrag = 'drag_stop';

    this.text = props.text ?? " ";
    this.stamps = props.stamps ?? " ";
  }

  renderItem() {
    return (
      <Fragment>
        <img src={resolveAsset("paper.png")} className={this.className+'-icon'} />
        {this.debug && (<div className={this.className+'-textBox'}> {sanitizeHTML(this.text)+this.stamps} </div>)}
        {!this.debug && (<div className={this.className+'-textBox'}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(this.text) }} />)}
        {!this.debug && (<div className={this.className+'-stamps'}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: this.stamps }} />)}
      </Fragment>
    );
  }
}

const Speaker = (props, context) => {
  const { act, config } = useBackend(context);
  // We don't want players to be able to spam this
  const cooldown = 3000;
  const [timer, setTimer] = useSharedState(context, "speaker_timer", new Date().getTime()-(cooldown+1));
  return (
    <img src={resolveAsset("speaker.png")} className={'InspectorBooth__Speaker'}
    onClick={() => {
      const time = new Date().getTime();
      if (time - timer > cooldown) {
        act('play_sfx', { name: 'speaker', ckey: config.client?.ckey, vary: -1 });
        setTimer(time);
      }
    }} />
  );
};

const Receptacle = (props, context) => {
  // const [isDragging] = useLocalState(context, "isDragging", false);
  const [zIndex] = useSharedState(context, "zindex", 0);
  const className = 'InspectorBooth__Receptacle';
  const style = {
    "z-index": props.renderAboveItems? zIndex+1000 : "auto",
  };
  return (
    <div className={className+' '+className+'--'+props.type} style={style}
    data-exec={props.type} data-collision={props.collision ?? 'overlap'}>
      { props.children }
    </div>
  );
};

const processItem = (context, item, item_id) => {
  const { act, config } = useBackend(context);
  const { isSmall } = item.state;
  const bins = document.getElementsByClassName('InspectorBooth__Receptacle');
  for (let i = 0; i < bins.length; i++) {
    let collision = bins[i].dataset.collision === 'overlap' ? overlap : inside;
    if (collision(item.ref, bins[i])) {
      let result = bins[i].dataset.exec;
      switch (result) {
        case 'drop_item':
          if (item.removable) {
            act(result, { id: item_id });
          }
          return;
        case 'take_item':
          if (item.removable && isSmall) {
            act(result, { id: item_id, ckey: config.client?.ckey });
          }
          return;
      }
    }
  }
};

export const InspectorBooth = (props, context) => {
  const { data } = useBackend(context);
  const { debug, items=[] } = data;
  const className = 'InspectorBooth';
  return (
    <Window width={775} height={500} >
      <div className={className} style={`background-image: url(${resolveAsset("desk_bg.png")});`}>
        {items.papers?.map(item => (
          <Paperwork removable dragVisible debug={debug===1} item_id={item.id} text={item.text} stamps={item.stamps}
          x={item.x} y={item.y} z={item.z} key={item.id+item.x+item.y+item.z+item.text+item.stamps+debug} />
        ))}
        <StampTray />
        <Receptacle type={'shrink'} renderAboveItems>
          <Receptacle type={'drop_item'} collision={'inside'} >
            <Speaker />
          </Receptacle>
            <div className={className+'__Desk'} >
              <img src={resolveAsset("desk_top.png")} className={className+'__Desk__top'} />
                <span className={className+'__Desk__filler'} />
              <img src={resolveAsset("desk_bottom.png")} className={className+'__Desk__bottom'} />
            </div>
          <Receptacle type={'take_item'} />
        </Receptacle>
      </div>
    </Window>
  );
};
