import { useBackend, setSharedState } from '../backend';
import { Window } from '../layouts';

class StampTray extends Component {
  constructor(props) {
    super(props);
    this.expanded = false;

  };
}

export const InspectorBooth = (props, context) => {
  const { act, data } = useBackend(context);

  return (
    <Window>
      <Window.Content>
        <StampTray/>
      </Window.Content>
    </Window>
  );
};
