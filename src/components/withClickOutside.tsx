/**
 * Higher-Order Component for click outside detection
 * Replaces useClickOutside hook to eliminate React hooks from production code
 * Uses class component lifecycle methods for event management
 */

import React, { Component, createRef, ComponentType } from 'react';

export interface WithClickOutsideProps {
  onClickOutside?: () => void;
  clickOutsideEnabled?: boolean;
}

export interface WithClickOutsideState {
  isListening: boolean;
}

/**
 * HOC that adds click outside detection to any component
 */
export function withClickOutside<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return class WithClickOutside extends Component<P & WithClickOutsideProps, WithClickOutsideState> {
    private containerRef = createRef<HTMLDivElement>();

    constructor(props: P & WithClickOutsideProps) {
      super(props);
      this.state = {
        isListening: false
      };
    }

    componentDidMount() {
      if (this.props.clickOutsideEnabled !== false) {
        this.startListening();
      }
    }

    componentDidUpdate(prevProps: P & WithClickOutsideProps) {
      const wasEnabled = prevProps.clickOutsideEnabled !== false;
      const isEnabled = this.props.clickOutsideEnabled !== false;

      if (!wasEnabled && isEnabled) {
        this.startListening();
      } else if (wasEnabled && !isEnabled) {
        this.stopListening();
      }
    }

    componentWillUnmount() {
      this.stopListening();
    }

    startListening = () => {
      if (!this.state.isListening) {
        document.addEventListener('mousedown', this.handleDocumentClick);
        this.setState({ isListening: true });
      }
    };

    stopListening = () => {
      if (this.state.isListening) {
        document.removeEventListener('mousedown', this.handleDocumentClick);
        this.setState({ isListening: false });
      }
    };

    handleDocumentClick = (event: MouseEvent) => {
      if (
        this.containerRef.current &&
        !this.containerRef.current.contains(event.target as Node) &&
        this.props.onClickOutside
      ) {
        this.props.onClickOutside();
      }
    };

    render() {
      const { onClickOutside, clickOutsideEnabled, ...restProps } = this.props;
      
      return (
        <div ref={this.containerRef}>
          <WrappedComponent {...(restProps as P)} />
        </div>
      );
    }
  };
}

/**
 * Simple wrapper component for basic click outside functionality
 * Can be used directly without HOC pattern
 */
interface ClickOutsideWrapperProps {
  onClickOutside: () => void;
  enabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export class ClickOutsideWrapper extends Component<ClickOutsideWrapperProps> {
  private containerRef = createRef<HTMLDivElement>();

  componentDidMount() {
    if (this.props.enabled !== false) {
      document.addEventListener('mousedown', this.handleDocumentClick);
    }
  }

  componentDidUpdate(prevProps: ClickOutsideWrapperProps) {
    const wasEnabled = prevProps.enabled !== false;
    const isEnabled = this.props.enabled !== false;

    if (!wasEnabled && isEnabled) {
      document.addEventListener('mousedown', this.handleDocumentClick);
    } else if (wasEnabled && !isEnabled) {
      document.removeEventListener('mousedown', this.handleDocumentClick);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentClick);
  }

  handleDocumentClick = (event: MouseEvent) => {
    if (
      this.containerRef.current &&
      !this.containerRef.current.contains(event.target as Node)
    ) {
      this.props.onClickOutside();
    }
  };

  render() {
    return (
      <div ref={this.containerRef} className={this.props.className}>
        {this.props.children}
      </div>
    );
  }
}