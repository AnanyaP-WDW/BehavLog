import { describe, it, expect } from 'vitest';
import { KEYPOINT_DEFINITIONS, SKELETON_CONNECTIONS, FPS } from './keypoints';

describe('KEYPOINT_DEFINITIONS', () => {
  it('contains exactly 10 keypoint definitions', () => {
    expect(KEYPOINT_DEFINITIONS).toHaveLength(10);
  });

  it('each keypoint has required properties', () => {
    KEYPOINT_DEFINITIONS.forEach((kp) => {
      expect(kp).toHaveProperty('name');
      expect(kp).toHaveProperty('color');
      expect(kp).toHaveProperty('key');
      expect(typeof kp.name).toBe('string');
      expect(typeof kp.color).toBe('string');
      expect(typeof kp.key).toBe('string');
    });
  });

  it('each keypoint has a unique name', () => {
    const names = KEYPOINT_DEFINITIONS.map((kp) => kp.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('each keypoint has a unique keyboard shortcut', () => {
    const keys = KEYPOINT_DEFINITIONS.map((kp) => kp.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('keyboard shortcuts are single characters 0-9', () => {
    const validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    KEYPOINT_DEFINITIONS.forEach((kp) => {
      expect(validKeys).toContain(kp.key);
    });
  });

  it('each color is a valid hex color', () => {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    KEYPOINT_DEFINITIONS.forEach((kp) => {
      expect(kp.color).toMatch(hexColorRegex);
    });
  });

  it('contains expected keypoint names for mouse annotation', () => {
    const expectedNames = [
      'nose',
      'left_ear',
      'right_ear',
      'neck',
      'spine_mid',
      'tail_base',
      'left_front_paw',
      'right_front_paw',
      'left_hind_paw',
      'right_hind_paw',
    ];
    const actualNames = KEYPOINT_DEFINITIONS.map((kp) => kp.name);
    expect(actualNames).toEqual(expectedNames);
  });
});

describe('SKELETON_CONNECTIONS', () => {
  it('contains expected number of connections', () => {
    expect(SKELETON_CONNECTIONS.length).toBeGreaterThan(0);
    expect(SKELETON_CONNECTIONS).toHaveLength(9);
  });

  it('each connection is a tuple of two strings', () => {
    SKELETON_CONNECTIONS.forEach((connection) => {
      expect(connection).toHaveLength(2);
      expect(typeof connection[0]).toBe('string');
      expect(typeof connection[1]).toBe('string');
    });
  });

  it('all connection keypoints exist in KEYPOINT_DEFINITIONS', () => {
    const validNames = KEYPOINT_DEFINITIONS.map((kp) => kp.name);
    
    SKELETON_CONNECTIONS.forEach(([kp1, kp2]) => {
      expect(validNames).toContain(kp1);
      expect(validNames).toContain(kp2);
    });
  });

  it('contains expected skeleton structure', () => {
    const expectedConnections = [
      ['nose', 'neck'],
      ['neck', 'left_ear'],
      ['neck', 'right_ear'],
      ['neck', 'spine_mid'],
      ['spine_mid', 'tail_base'],
      ['neck', 'left_front_paw'],
      ['neck', 'right_front_paw'],
      ['spine_mid', 'left_hind_paw'],
      ['spine_mid', 'right_hind_paw'],
    ];
    
    expect(SKELETON_CONNECTIONS).toEqual(expectedConnections);
  });

  it('neck is the central hub of the skeleton', () => {
    const neckConnections = SKELETON_CONNECTIONS.filter(
      ([kp1, kp2]) => kp1 === 'neck' || kp2 === 'neck'
    );
    // Neck should connect to: nose, left_ear, right_ear, spine_mid, left_front_paw, right_front_paw
    expect(neckConnections.length).toBeGreaterThanOrEqual(4);
  });
});

describe('FPS', () => {
  it('is defined and is a positive number', () => {
    expect(FPS).toBeDefined();
    expect(typeof FPS).toBe('number');
    expect(FPS).toBeGreaterThan(0);
  });

  it('is set to 30 fps', () => {
    expect(FPS).toBe(30);
  });
});
