import * as React from 'react';
import renderer from 'react-test-renderer';

import { MonoText } from '../StyledText';

it(`renders correctly`, async () => {
  let component;
  await renderer.act(async () => {
    component = renderer.create(<MonoText>Snapshot test!</MonoText>);
  });

  expect(component.toJSON()).toMatchSnapshot();
});
