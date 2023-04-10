import { Fragment, Component } from 'inferno';
import { useBackend } from '../backend';

export class Draggable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      initX: 0, initY: 0,
      dX: this.props.x ?? 0,
      dY: this.props.y ?? 0,
      pX: 0, pY: 0,
    };
    this.debug = this.props.debug;
    this.drag = this.props.drag === undefined ? {} : this.props.drag;
    this.z = this.props.z === undefined? 0 : this.props.z;

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.handleInitDrag = this.handleInitDrag.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
  }

  initRef(ref) {
    this.ref = ref;
    if (this.ref) {
      let pos = ref.getBoundingClientRect();
      this.setState({
        initX: 100*pos.left/window.innerWidth,
        initY: 100*pos.top/window.innerHeight,
      });
    }
  }

  handleInitDrag(e) {
    // Ignore if not left click
    if (e.button !== 0) return;
    // const { initX, initY } = this.state;
    this.setState({
      pX: e.clientX,
      pY: e.clientY,
      /* dX: 100*(e.clientX - initX - this.ref.clientWidth/2)/window.innerWidth,
      dY: 100*(e.clientY - initY - this.ref.clientHeight/2)/window.innerHeight,*/
      dragging: true,
    });
    window.addEventListener("mousemove", this.startDrag, false);
    window.addEventListener("mouseup", this.stopDrag, false);
    this.props.onDrag(this);
  }

  startDrag(e) {
    const { initX, initY } = this.state;
    let maxX, maxY = 0;
    if (this.ref) {
    let bounds = this.ref.getBoundingClientRect();
      maxX = 100*(1-bounds.width/window.innerWidth);
      maxY = 100*(1-bounds.height/window.innerHeight);
    }
    // Multiply by 100/window size to convert from px to vw/vh
    this.setState(prev => ({
      dX: clamp(initX + 100*(e.clientX - prev.pX)/window.innerWidth, 0, maxX),
      dY: clamp(initY + 100*(e.clientY - prev.pY)/window.innerHeight, 0, maxY),
    }));
  }

  // remove event listeners when the component is not being dragged
  stopDrag() {
    let left, top = 0;
    if (this.ref) {
      left = this.ref.getBoundingClientRect().left;
      top = this.ref.getBoundingClientRect().top;
    }
    this.setState({
      initX: 100*left/window.innerWidth,
      initY: 100*top/window.innerHeight,
      dragging: false,
    });
    window.removeEventListener("mousemove", this.startDrag, false);
    window.removeEventListener("mouseup", this.stopDrag, false);
    this.props.stopDrag(this);
  }

  render() {
    const { dX, dY, dragging } = this.state;
    const style = {
      position: "absolute",
      transform: `translate(${dX}vw, ${dY}vh)`,
      border: this.debug ? "2px solid rgba(255, 0, 0, 1)" : "none",
      "z-index": this.z,
    };
    const debug = {
      position: "absolute",
      transform: `translate(${dX}vw, ${dY - 2.5}vh)`,
      color: "red",
    };
    let pos = null;
    if (this.debug && this.ref) {
      pos = this.ref.getBoundingClientRect();
    }
    return (
      <Fragment>
        <div style={{ ...style, ...dragging? this.drag : {} }} onMouseDown={this.handleInitDrag} ref={this.initRef}>
        { this.props.children }
        </div>
        {pos && <div style={debug}> x: {pos.left}, y: {pos.top}, z: {this.z} </div>}
      </Fragment>
    );
  }
}

const clamp = (val, min, max) => {
  return val > max ? max : val < min ? min : val;
};
