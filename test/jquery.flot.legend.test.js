describe('jquery.flot.legend', function () {

    describe('.getLineWidth', function() {
        it('should return a sensible default value', function() {
            expect(getLineWidth(options)).toBe(15);
        });
    });

    describe('.tokenizeStatement', function() {
        it('should be able to convert statements to tokens', function() {
            var tokens = tokenizeStatement('Max  : %8.2lf %s\\n');
            expect(tokens.length).toBe(5);

            expect(tokens[0].type).toBe(TOKENS.Text);
            expect(tokens[0].value).toBe('Max  : ');

            expect(tokens[1].type).toBe(TOKENS.Lf);
            expect(tokens[1].length).toBe(8);
            expect(tokens[1].precision).toBe(2);

            expect(tokens[2].type).toBe(TOKENS.Text);
            expect(tokens[2].value).toBe(' ');

            expect(tokens[3].type).toBe(TOKENS.Unit);

            expect(tokens[4].type).toBe(TOKENS.Newline);
        });

        it('should be able to handle lf tokens with and without specifiers', function() {
            var tokens = tokenizeStatement('%10.5lf');
            expect(tokens[0].type).toBe(TOKENS.Lf);
            expect(tokens[0].length).toBe(10);
            expect(tokens[0].precision).toBe(5);

            tokens = tokenizeStatement('%.3lf');
            expect(tokens[0].type).toBe(TOKENS.Lf);
            expect(tokens[0].length).toBe(null);
            expect(tokens[0].precision).toBe(3);

            tokens = tokenizeStatement('%lf');
            expect(tokens[0].type).toBe(TOKENS.Lf);
            expect(tokens[0].length).toBe(null);
            expect(tokens[0].precision).toBe(null);

            tokens = tokenizeStatement('%7lf');
            expect(tokens[0].type).toBe(TOKENS.Lf);
            expect(tokens[0].length).toBe(7);
            expect(tokens[0].precision).toBe(null);
        });

        it('should always insert a space for statement that include badges', function() {
            var tokens = tokenizeStatement('%g');
            expect(tokens.length).toBe(2);
            expect(tokens[0].type).toBe(TOKENS.Badge);
            expect(tokens[1].type).toBe(TOKENS.Text);
            expect(tokens[1].value).toBe(' ');
        });
    });

    describe('.reduceWithAggregate', function() {
        var dataWithNaNs = [
            [0,0],
            [1,1],
            [2,NaN],
            [3,3]
        ];

        var stackedDataWithNaNs = [
            [0,1,1],
            [1,3,2],
            [2,NaN,NaN],
            [3,6,3]
        ];

        it('should support MIN, MAX, AVERAGE and LAST aggregation functions', function () {
            expect(reduceWithAggregate(dataWithNaNs, 'MIN')).toBeCloseTo(0, 0.0001);
            expect(reduceWithAggregate(dataWithNaNs, 'MAX')).toBeCloseTo(3, 0.0001);
            expect(reduceWithAggregate(dataWithNaNs, 'AVERAGE')).toBeCloseTo(1.3333, 0.0001);
            expect(reduceWithAggregate(dataWithNaNs, 'LAST')).toBeCloseTo(3, 0.0001);
        });

        it('should support MIN, MAX, AVERAGE and LAST aggregation functions on stacked data', function () {
            expect(reduceWithAggregate(stackedDataWithNaNs, 'MIN')).toBeCloseTo(0, 0.0001);
            expect(reduceWithAggregate(stackedDataWithNaNs, 'MAX')).toBeCloseTo(3, 0.0001);
            expect(reduceWithAggregate(stackedDataWithNaNs, 'AVERAGE')).toBeCloseTo(1.3333, 0.0001);
            expect(reduceWithAggregate(stackedDataWithNaNs, 'LAST')).toBeCloseTo(3, 0.0001);
        });
    });

});
