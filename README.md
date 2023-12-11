# ⛔️ DEPRECATED
We have deprecated this repository and migrated our codebase to a new mono repository structure, please follow [this](https://github.com/gluestack/gluestack-ui) link to access our latest updates and features.

<h3 align="center">
  <a href="https://github.com/gluestack/gluestack-style">
    <img src="https://raw.githubusercontent.com/gluestack/gluestack-style/main/img/gluestack-logo.svg" alt="gluestack logo">
  </a>
  <br>
  <br>
</h3>

**A library that allows you to use CSS in your React and React Native projects with a modern, powerful and flexible way. `gluestack-style` allows you to write CSS using JavaScript, which enables you to take advantage of the power and expressiveness of both languages. With its simple and intuitive API, you can easily create dynamic styles, responsive design, and handle themes for your applications.**

## Documentation

You can find detailed documentation for each component, including a list of props and examples, in https://gluestack.io/style/docs/getting-started/installation website.

## Features

- **Dynamic styles:** Using JavaScript expressions, you can create dynamic styles that change based on the state of your components.

- **Server-side rendering (SSR) support:** This allows you to use the same styles on the server and the client, making it easy to implement SSR for your React applications..

- **Responsive styling::** This allows you to easily create responsive styles that adapt to different screen sizes and resolutions.

- **Theme support:** You can easily define and switch between different themes for your application, allowing for a consistent design across all pages.

- **Frequent updates:** We are constantly working on improving the library and adding new components. Follow us on GitHub to stay up-to-date on the latest releases and features.

- **Community support:** Need help using the library or have a suggestion for a new feature? Join our Discord channel to connect with the community and get support.

## Installing `gluestack-style`

To use `gluestack-style`, all you need to do is install the
`@gluestack-style/react` package and its peer dependencies:

```sh
$ yarn add @gluestack-style/react

# or

$ npm i @gluestack-style/react
```

## Tech Stack

JavaScript, React, React Native, Styled System

## Usage

To use the `gluestack-style` in your project, follow these steps:

1. Wrap your application with the `StyledProvider` provided by
   **@gluestack-style/react**.

```jsx
import { StyledProvider } from '@gluestack-style/react';

// Do this at the root of your application
function App({ children }) {
  return <StyledProvider>{children}</StyledProvider>;
}
```

2. Now you can use `@gluestack-style/react` to style your components by using the `styled` function provided by the library. For example:

```jsx
import React from 'react';
import { styled, StyledProvider } from '@gluestack-style/react';

const StyledButton = styled(
  Pressable,
  {
    bg: '$red500',
    p: '$3',
  },
  {}
);

const StyledButtonText = styled(Text, {}, {});

export const App = () => {
  return (
    <StyledProvider>
      <StyledButton>
        <StyledButtonText>Button</StyledButtonText>
      </StyledButton>
    </StyledProvider>
  );
};
```

More guides on how to get started are available
[here](https://gluestack.io/style/docs).

## Contributing

We welcome contributions to the `gluestack-style`! If you have an idea for a new component or a bug fix, please read our [contributing guide](./CONTRIBUTING.md) instructions on how to submit a pull request.

## License

Licensed under the MIT License, Copyright © 2021 GeekyAnts. See [LICENSE](https://github.com/gluestack/gluestack-style/blob/main/LICENSE) for more information.
