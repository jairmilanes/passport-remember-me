import * as utils from "../src/utils"

describe('Utils', () => {
    it('should deeply merge objects', () => {
        const ob1 = {
            key: '1',
            third: {
                forth: '4',
                sixth: {
                    seventh: '7'
                }
            }
        };

        const ob2 = {
            second: '2',
            third: {
                forth: '5',
                fift: '5',
                seventh: {
                    eigth: '8'
                }
            }
        };

        const result = {
            key: '1',
            second: '2',
            third: {
                forth: '5',
                fift: '5',
                sixth: {
                    seventh: '7'
                },
                seventh: {
                    eigth: '8'
                }
            }
        };

        expect(utils.merge(ob1, ob2)).toEqual(result);
    })
})